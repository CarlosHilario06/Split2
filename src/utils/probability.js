export function calculateProbabilities(links, options = {}) {
  const alpha = options.alpha ?? 0.6;
  const epsilon = options.epsilon ?? 0.1;
  const minProb = options.minProb ?? 0.05;
  const maxProb = options.maxProb ?? 0.55;

  const minImpressions = options.minImpressions ?? 1000;
  const minEcpm = options.minEcpm ?? 0.01;

  const activeLinks = links.filter((link) => !link.disabled);
  const totalLinks = activeLinks.length;

  if (totalLinks === 0) return [];

  if (totalLinks === 1) {
    return [{ ...activeLinks[0], prob: 1 }];
  }

  const scoredLinks = activeLinks.map((link) => {
    const ecpm = Math.max(Number(link.ecpm || 0), minEcpm);
    const impressions = Number(link.impressions || 0);

    const confidence = Math.min(impressions / minImpressions, 1);

    const score = Math.pow(ecpm, alpha) * confidence;

    return {
      ...link,
      ecpmValue: ecpm,
      impressions,
      confidence,
      score: Math.max(score, 0.01),
    };
  });

  const totalScore = scoredLinks.reduce((sum, link) => {
    return sum + link.score;
  }, 0);

  let probs = scoredLinks.map((link) => link.score / totalScore);

  probs = probs.map((prob) => {
    return (1 - epsilon) * prob + epsilon / totalLinks;
  });

  probs = probs.map((prob) => Math.max(prob, minProb));
  probs = probs.map((prob) => Math.min(prob, maxProb));

  const finalSum = probs.reduce((sum, prob) => sum + prob, 0);

  return scoredLinks.map((link, index) => ({
    ...link,
    prob: probs[index] / finalSum,
  }));
}