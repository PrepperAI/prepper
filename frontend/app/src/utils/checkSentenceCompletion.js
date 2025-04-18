// Check if a sentence is complete
function checkSentenceCompletion(result) {
  const text = result.text.trim();

  // Additional linguistic checks
  const words = text.split(/\s+/);

  // FIRST TIER - Fundamental structural incompleteness

  // Check for incomplete conjunctions at the end
  const hasConjunctionAtEnd =
    /\b(and|but|or|because|so|if|while|although|since|though|unless|whereas|yet)[\s\.,!?]*$/.test(
      text
    );
  if (hasConjunctionAtEnd) {
    console.log("Incomplete sentence detected (ends with conjunction)");
    return false;
  }

  // Check for trailing prepositions
  const endsWithPreposition =
    /\b(in|on|at|to|with|of|from|for|by|about|above|across|after|against|along|among|around|before|behind|below|beneath|beside|between|beyond|during|except|inside|into|near|off|onto|outside|over|through|throughout|toward|towards|under|underneath|until|upon|within|without)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithPreposition) {
    console.log("Incomplete sentence detected (ends with preposition)");
    return false;
  }

  // Check for split infinitives
  const endsWithSplitInfinitive = /\bto[\s\.,!?]*$/.test(text);
  if (endsWithSplitInfinitive) {
    console.log("Incomplete sentence detected (ends with 'to')");
    return false;
  }

  // Check for trailing articles or determiners
  const endsWithDeterminer =
    /\b(a|an|the|this|that|these|those|my|your|his|her|its|our|their|some|any|every|each|either|neither|both|much|many|more|most|few|fewer|all|no)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithDeterminer) {
    console.log("Incomplete sentence detected (ends with determiner)");
    return false;
  }

  // SECOND TIER - Linguistic markers of incompleteness

  // Check for trailing filler phrases - expanded list
  const endsWithFiller =
    /\b(like|you know|I mean|um|uh|well|sort of|kind of|basically|literally|actually|anyway|so|just|right|okay|hmm|er|eh)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithFiller) {
    console.log("Potentially incomplete sentence (ends with filler)");
    return false;
  }

  // Check for trailing question words
  const endsWithQuestionWord =
    /\b(who|what|where|when|why|how|which|whose|whom)[\s\.,]?(?!\?)*$/.test(
      text
    );
  if (endsWithQuestionWord) {
    console.log(
      "Incomplete sentence detected (ends with question word without question mark)"
    );
    return false;
  }

  // Check for "such as" followed by nothing
  const endsWith_SuchAs = /\bsuch as[\s\.,!?]*$/.test(text);
  if (endsWith_SuchAs) {
    console.log("Incomplete sentence detected (ends with 'such as')");
    return false;
  }

  // Check for trailing possessive markers
  const endsWithPossessive =
    /('s|of the|of my|of your|of his|of her|of their|of our)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithPossessive) {
    console.log("Incomplete sentence detected (ends with possessive marker)");
    return false;
  }

  // Check for 'that' followed by nothing (often introducing a relative clause)
  const endsWith_That = /\bthat[\s\.,!?]*$/.test(text);
  if (endsWith_That) {
    console.log("Incomplete sentence detected (ends with 'that')");
    return false;
  }

  // THIRD TIER - Semantic incompleteness

  // Check for trailing transition words
  const endsWithTransition =
    /\b(however|furthermore|moreover|additionally|consequently|therefore|nevertheless|meanwhile|afterward|subsequently|then|next|later|finally|thus|accordingly|similarly|likewise|instead|otherwise|still|anyway|besides|indeed|rather)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithTransition) {
    console.log("Incomplete sentence detected (ends with transition word)");
    return false;
  }

  // Check for trailing comparison words
  const endsWithComparison =
    /\b(than|as|like|compared to|similar to|in contrast to|whereas|unlike|more|less|better|worse|rather than|such as)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithComparison) {
    console.log("Incomplete sentence detected (ends with comparison word)");
    return false;
  }

  // Check for numerical sequences
  const endsWithSequence =
    /\b(first|firstly|second|secondly|third|thirdly|fourth|fifth|last|lastly|finally|initially|one|two|three|four|five|next|then|after that)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithSequence) {
    console.log("Incomplete sentence detected (ends with sequence indicator)");
    return false;
  }

  // Check for trailing verbal auxiliaries
  const endsWithAuxiliary =
    /\b(am|is|are|was|were|have|has|had|will|would|could|should|might|must|can|do|does|did|going to|used to|ought to)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithAuxiliary) {
    console.log("Incomplete sentence detected (ends with auxiliary verb)");
    return false;
  }

  // Check for trailing adjectives without nouns
  const endsWithAdjective =
    /\b(big|small|large|tiny|huge|great|good|bad|beautiful|ugly|happy|sad|angry|excited|interesting|boring|red|blue|green|yellow|black|white|new|old|young|ancient|modern|traditional|digital|analog|manual|automatic|favorite|best|worst|better|worse)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithAdjective) {
    console.log("Incomplete sentence detected (ends with adjective)");
    return false;
  }

  // Check for trailing quantifiers without objects
  const endsWithQuantifier =
    /\b(few|many|much|several|some|any|plenty of|a lot of|lots of|numerous|countless|various|multiple|diverse|more|less|enough|insufficient)[\s\.,!?]*$/.test(
      text
    );
  if (endsWithQuantifier) {
    console.log("Incomplete sentence detected (ends with quantifier)");
    return false;
  }

  // FOURTH TIER - Structural checks

  // Check for quote or parenthesis imbalance
  const hasUnbalancedQuotes = (text.match(/"/g) || []).length % 2 !== 0;
  const hasUnbalancedParentheses =
    (text.match(/\(/g) || []).length !== (text.match(/\)/g) || []).length;
  if (hasUnbalancedQuotes || hasUnbalancedParentheses) {
    console.log(
      "Incomplete sentence detected (unbalanced quotes or parentheses)"
    );
    return false;
  }

  // Check for numeral lists
  const endsWithListItem = /\b(\d+\.|[a-z]\)|[A-Z]\.|•|-|\*)[\s]*$/.test(text);
  if (endsWithListItem) {
    console.log("Incomplete sentence detected (ends with list marker)");
    return false;
  }

  // Check for a reasonable sentence length
  if (words.length < 3 && !isCommonFragment) {
    console.log("Sentence too short to be complete");
    return false;
  }

  // FIFTH TIER - Completeness indicators

  // Basic check for ending punctuation
  const hasEndPunctuation = /[.!?]$/.test(text);
  if (hasEndPunctuation) {
    console.log("Complete sentence detected (has ending punctuation)");
    return true;
  }

  // Check for short responses that are likely complete
  const isCommonFragment =
    /^(yes|no|maybe|exactly|absolutely|right|sure|correct|incorrect|possibly|definitely|sometimes|never|always|of course|certainly|indeed)[\s\.,!?]*/i.test(
      text
    );
  if (isCommonFragment && words.length <= 5) {
    console.log("Common fragment detected as complete response");
    return true;
  }

  // Using prosody data for completion detection
  try {
    const detailedResult = JSON.parse(result.json);

    if (detailedResult.NBest && detailedResult.NBest.length > 0) {
      const prosody = detailedResult.NBest[0].Prosody;

      // Falling intonation often indicates sentence completion
      if (prosody && prosody.ContourPoints) {
        const points = prosody.ContourPoints;
        if (points.length > 1) {
          const lastTwoPoints = points.slice(-2);
          const isFallingIntonation =
            lastTwoPoints[0].Value > lastTwoPoints[1].Value;

          if (isFallingIntonation) {
            console.log(
              "Falling intonation detected - likely sentence completion"
            );
            return true;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error parsing prosody data:", error);
  }

  // DEFAULT CASE - When unsure, err on the side of incompleteness
  console.log("No strong indicators of completion or incompletion");
  return false;
}
