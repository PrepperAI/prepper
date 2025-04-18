import React from "react";
import styles from "./TechnicalInterviewLandingPage.module.css";
import { useNavigate } from "react-router-dom";

const techStack = [
  {
    title: "React",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    description: "Practice frontend UI coding with React.",
    route: "/interview/technical/react",
  },
  {
    title: "Node.js",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    description: "Work on backend APIs, auth, and more.",
    route: "/interview/technical/node",
  },
  {
    title: "Flask",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg",
    description: "Test your Python backend knowledge.",
    route: "/interview/technical/flask",
  },
  {
    title: "Django",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg",
    description: "Practice interviews focused on Django.",
    route: "/interview/technical/django",
  },
  {
    title: "Spring",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg",
    description: "Java backend and system design with Spring.",
    route: "/interview/technical/spring",
  },
];

const dsa = [
  {
    title: "Array",
    icon: "https://cdn-icons-png.flaticon.com/512/3039/3039386.png", // Array/sequential boxes
    route: "/interview/technical/array",
  },
  {
    title: "String",
    icon: "https://cdn-icons-png.flaticon.com/512/2950/2950107.png", // String of characters
    route: "/interview/technical/string",
  },
  {
    title: "Hash Table",
    icon: "https://cdn-icons-png.flaticon.com/512/3406/3406894.png", // Hash table buckets
    route: "/interview/technical/hash",
  },
  {
    title: "Graph",
    icon: "https://cdn-icons-png.flaticon.com/512/7193/7193758.png", // Connected nodes graph
    route: "/interview/technical/graph",
  },
  {
    title: "Heap",
    icon: "https://cdn-icons-png.flaticon.com/512/6911/6911466.png", // Binary heap pyramid
    route: "/interview/technical/heap",
  },
  {
    title: "Binary Tree",
    icon: "https://cdn-icons-png.flaticon.com/512/8226/8226419.png", // Actual binary tree
    route: "/interview/technical/binary-tree",
  },
  {
    title: "Recursion",
    icon: "https://cdn-icons-png.flaticon.com/512/6911/6911763.png", // Nested recursive pattern
    route: "/interview/technical/recursion",
  },
  {
    title: "Dynamic Programming",
    icon: "https://cdn-icons-png.flaticon.com/512/2821/2821739.png", // Overlapping subproblems grid
    route: "/interview/technical/dp",
  },
  {
    title: "Greedy",
    icon: "https://cdn-icons-png.flaticon.com/512/3564/3564155.png", // Optimal choice/path
    route: "/interview/technical/greedy",
  },
  {
    title: "Two Pointers",
    icon: "https://cdn-icons-png.flaticon.com/512/8686/8686022.png", // Two pointers on array
    route: "/interview/technical/two-pointers",
  },
  {
    title: "Sliding Window",
    icon: "https://cdn-icons-png.flaticon.com/512/4297/4297132.png", // Window sliding on data
    route: "/interview/technical/sliding-window",
  },
  {
    title: "Backtracking",
    icon: "https://cdn-icons-png.flaticon.com/512/8161/8161438.png", // Decision tree with backtracking
    route: "/interview/technical/backtracking",
  },
];
const TechnicalInterviewLandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.technicalContainer}>
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Technical Interview</h1>
        <p className={styles.subtitle}>
          Choose a topic or tech stack to practice technical interview
          questions.
        </p>
      </div>

      <h2 className={styles.sectionTitle}>Data Structures & Algorithms</h2>
      <div className={styles.cardGrid}>
        {dsa.map((item, index) => (
          <div key={index} className={styles.card}>
            <h3>{item.title}</h3>
            <button
              className={styles.startButton}
              onClick={() =>
                navigate("/interview/technical/setup", {
                  state: { focusArea: item.title },
                })
              }
            >
              Start
            </button>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Tech Stacks</h2>
      <div className={styles.cardGrid}>
        {techStack.map((stack, index) => (
          <div key={index} className={styles.card}>
            <img src={stack.icon} alt={stack.title} />
            <h3>{stack.title}</h3>
            <p>{stack.description}</p>
            <button
              className={styles.startButton}
              onClick={() =>
                navigate("/interview/technical/setup", {
                  state: { focusArea: stack.title },
                })
              }
            >
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnicalInterviewLandingPage;
