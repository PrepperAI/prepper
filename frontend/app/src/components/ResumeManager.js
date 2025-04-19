import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from "../context/UserContext";
import styles from "./ResumeManager.module.css";
import ResumePreviewModal from "./ResumePreviewModal";
import { FileText, Star, Trash2, Upload } from "lucide-react";
import { API_BASE_URL } from "../utils/api";

const ResumeManager = () => {
  const { user } = useUser();
  const [resumes, setResumes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const fetchResumes = async () => {
    if (!user) return;
    const snap = await getDocs(collection(db, "users", user.uid, "resumes"));
    let data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    data.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    setResumes(data);
  };

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    if (resumes.length >= 20) {
      alert("You can only store up to 20 resumes. Please delete one first.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.uid);

      const res = await fetch(
        `${API_BASE_URL}/api/upload-resume?user_id=${user.uid}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();

      await addDoc(collection(db, "users", user.uid, "resumes"), {
        name: file.name,
        url: data.url,
        uploadedAt: new Date(),
        isDefault: resumes.length === 0,
      });

      await fetchResumes();
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resume) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "resumes", resume.id));
    await fetchResumes();
    if (previewUrl === resume.url) {
      setPreviewUrl(null);
    }
  };

  const makeDefault = async (resumeId) => {
    const batch = await getDocs(collection(db, "users", user.uid, "resumes"));
    for (const r of batch.docs) {
      await updateDoc(doc(db, "users", user.uid, "resumes", r.id), {
        isDefault: r.id === resumeId,
      });
    }
    await fetchResumes();
  };

  return (
    <div className={styles.manager}>
      <h2>
        <FileText size={20} style={{ marginRight: "8px" }} />
        My Resumes
      </h2>

      <div
        className={styles.uploadDropzone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleUpload({ target: { files: [file] } });
        }}
      >
        <label htmlFor="resume-upload" className={styles.uploadLabel}>
          <Upload size={16} style={{ marginRight: "4px" }} />
          Upload Resume
        </label>
        <input
          id="resume-upload"
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          disabled={resumes.length >= 20}
          hidden
        />
      </div>

      {uploading && <p className={styles.uploading}>Uploading...</p>}
      {resumes.length >= 20 && (
        <p className={styles.limitWarning}>
          You've reached the max resume limit (20).
        </p>
      )}

      <ul className={styles.list}>
        {resumes.slice(0, visibleCount).map((resume) => (
          <li key={resume.id} className={styles.resumeItem}>
            <div className={styles.resumeInfo}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPreviewUrl(resume.url);
                }}
                className={styles.resumeLink}
              >
                {resume.name}
              </a>
              {resume.uploadedAt && (
                <small className={styles.uploadedAt}>
                  Uploaded:{" "}
                  {new Date(
                    resume.uploadedAt.seconds
                      ? resume.uploadedAt.seconds * 1000
                      : resume.uploadedAt
                  ).toLocaleDateString()}
                </small>
              )}
              {resume.isDefault && (
                <span className={styles.default}>
                  <Star size={14} style={{ marginRight: "4px" }} />
                  Default
                </span>
              )}
            </div>
            <div className={styles.actions}>
              <button onClick={() => makeDefault(resume.id)}>
                <Star size={14} /> Set as Default
              </button>
              <button onClick={() => handleDelete(resume)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {visibleCount < resumes.length && (
        <button
          className={styles.loadMore}
          onClick={() => setVisibleCount((prev) => prev + 5)}
        >
          Load More
        </button>
      )}

      {previewUrl && (
        <ResumePreviewModal
          url={previewUrl}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  );
};

export default ResumeManager;
