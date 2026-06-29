const TESTS = [
  {
    id: "shapiro",
    name: "Shapiro-Wilk Test",
    short: "Shapiro-Wilk",
    category: "Distribution Check",
    type: "gatekeeper",
    rail: "either",
    oneLiner: "Checks whether a sample plausibly came from a normal distribution.",
    definition: "The Shapiro-Wilk test asks one narrow question: does this sample look like it was drawn from a normal (bell-curve) distribution? It compares the shape of your sorted data against the shape we'd expect under perfect normality and returns a single statistic, W, between 0 and 1. Values close to 1 mean the data look normal; the p-value tells you how surprising your W would be if the data really were normal.",
    hypotheses: {
      h0: "The sample comes from a normally distributed population.",
      h1: "The sample does not come from a normally distributed population."
    },
    assumptions: [
      "Observations are independent of each other",
      "Data is continuous (not categorical or count data)",
      "Works best for sample sizes between ~7 and 2000; for very large n it gets overly sensitive to tiny deviations"
    ],
    whenToUse: "Run this before choosing between a parametric test (t-test, ANOVA, Pearson correlation) and its non-parametric counterpart. It's a gatekeeper test, not an end result — its only job is to tell you which fork to take next.",
    statisticIdea: "W = (sum of weighted order statistics)^2 / (sum of squared deviations from the mean). It's essentially checking how well a straight line fits a Q-Q plot of your data.",
    mlExample: {
      scenario: "You've engineered a feature, customer_lifetime_value, for a churn model and want to know whether to feed it into a linear model raw, or log-transform it first.",
      data: "You run Shapiro-Wilk on 500 customer LTV values. W = 0.81, p < 0.001.",
      conclusion: "Reject H0 — the feature is far from normal (heavily right-skewed, as revenue data usually is). You log-transform LTV before feeding it to a linear or logistic regression, or you switch to a tree-based model that doesn't care about normality at all."
    },
    prosCons: {
      pros: ["Most powerful normality test for small-to-moderate samples", "Simple single statistic, easy to automate in a pipeline"],
      cons: ["Over-sensitive with large n (n > 2000) — will flag trivial deviations as 'significant'", "Doesn't tell you *how* the data deviates from normal, just that it does"]
    },
    related: "ks_one_sample",
    relatedLabel: "Alternative: Kolmogorov-Smirnov (1-sample)"
  },
  {
    id: "ks_one_sample",
    name: "Kolmogorov–Smirnov Test",
    short: "KS Test",
    category: "Distribution Check",
    type: "gatekeeper",
    rail: "either",
    oneLiner: "Compares a sample's distribution to a reference distribution — or compares two samples to each other (used heavily for drift detection).",
    definition: "The KS test measures the largest vertical gap between two cumulative distribution functions (CDFs). In the one-sample version, you compare your data's CDF against a theoretical one (e.g. normal). In the two-sample version — extremely common in ML — you compare two empirical CDFs directly, such as a model's training-time feature distribution versus its live production distribution.",
    hypotheses: {
      h0: "The two distributions (sample vs reference, or sample A vs sample B) are the same.",
      h1: "The distributions differ."
    },
    assumptions: [
      "Data is continuous",
      "Samples are independent",
      "For the 1-sample version, the reference distribution's parameters should be known in advance, not estimated from the same data"
    ],
    whenToUse: "Use the 1-sample KS test as another normality/distribution-shape gate (alternative to Shapiro-Wilk, more flexible since it works against any reference distribution, not just normal). Use the 2-sample KS test for data drift monitoring: is the distribution of a feature in this week's production traffic still the same as it was in training?",
    statisticIdea: "D = max |CDF_1(x) − CDF_2(x)| across all x. The biggest gap between the two cumulative curves, anywhere along the x-axis.",
    mlExample: {
      scenario: "You have a fraud-detection model in production. You want an automated weekly check for whether the distribution of the transaction_amount feature has drifted from what the model was trained on.",
      data: "2-sample KS test between training-set transaction_amount (50k rows) and last week's live transaction_amount (8k rows). D = 0.14, p = 0.002.",
      conclusion: "Reject H0 — significant drift detected. This is your trigger to investigate (maybe a new merchant category was onboarded) and consider retraining before model performance silently degrades."
    },
    prosCons: {
      pros: ["Works for any reference distribution, not just normal", "The 2-sample version is the industry-standard tool for ML drift monitoring", "Non-parametric, makes no distributional assumption about the data itself"],
      cons: ["Less powerful than Shapiro-Wilk specifically for detecting non-normality", "Most sensitive near the center of the distribution, can miss differences in the tails"]
    },
    related: "shapiro",
    relatedLabel: "Alternative for normality: Shapiro-Wilk"
  },
  {
    id: "levene",
    name: "Levene's Test",
    short: "Levene's Test",
    category: "Variance Check",
    type: "gatekeeper",
    rail: "either",
    oneLiner: "Checks whether two or more groups have equal variance — a key assumption behind the standard t-test and ANOVA.",
    definition: "Levene's test asks whether the spread (variance) of your outcome variable is the same across groups. It works by taking the absolute deviation of each point from its group's median, then running a one-way ANOVA on those deviations. If the deviations differ significantly across groups, the variances aren't equal.",
    hypotheses: {
      h0: "All groups have equal variance (homogeneity of variance / homoscedasticity).",
      h1: "At least one group's variance differs from the others."
    },
    assumptions: [
      "Groups are independent",
      "Data is at least ordinal/continuous",
      "Doesn't require the data itself to be normal — it's more robust here than Bartlett's test"
    ],
    whenToUse: "Run this before an independent-samples t-test or one-way ANOVA, alongside a normality check. If Levene's test is significant (unequal variances), use Welch's t-test instead of Student's t-test, or favor the non-parametric route (Mann-Whitney U / Kruskal-Wallis).",
    statisticIdea: "Take |x_ij − median_j| for every observation, then run a standard ANOVA F-test on these absolute deviations across groups.",
    mlExample: {
      scenario: "You're comparing model prediction error (residuals) between two customer segments — high-value vs low-value — before deciding how to weight them in a loss function.",
      data: "Levene's test on residuals from both segments: F = 6.2, p = 0.013.",
      conclusion: "Reject H0 — variances are unequal (high-value customers have much more erratic prediction error). This tells you a single global loss function may be inappropriate; consider per-segment models or variance-weighted loss."
    },
    prosCons: {
      pros: ["Robust to non-normal data, unlike Bartlett's test", "Quick assumption check that changes which downstream test you trust"],
      cons: ["Only tells you variances differ, not why or by how much", "Can still be underpowered with very small group sizes"]
    },
    related: "ttest_ind",
    relatedLabel: "Feeds into: Independent t-test / ANOVA choice"
  },
  {
    id: "ttest_ind",
    name: "Independent Samples t-test",
    short: "Independent t-test",
    category: "Compare 2 Groups",
    type: "parametric",
    rail: "parametric",
    oneLiner: "Compares the means of two independent groups to see if they're truly different.",
    definition: "The independent (unpaired) t-test compares the mean of a continuous variable between two separate, unrelated groups — for example, two different user segments, or treatment vs control. It standardizes the difference in means by the pooled (or Welch-adjusted) standard error to produce a t-statistic.",
    hypotheses: {
      h0: "The two group means are equal (μ1 = μ2).",
      h1: "The two group means are different (μ1 ≠ μ2)."
    },
    assumptions: [
      "Outcome variable is continuous",
      "The two groups are independent of each other",
      "Each group is approximately normally distributed (check with Shapiro-Wilk)",
      "Equal variances between groups (check with Levene's) — if violated, use Welch's t-test variant instead"
    ],
    whenToUse: "Use when comparing a continuous metric between exactly two independent groups, and both groups pass the normality and equal-variance checks. Classic case: comparing average session duration between users on app version A vs version B.",
    statisticIdea: "t = (mean1 − mean2) / standard_error_of_difference. The bigger the gap between means relative to the noise in the data, the larger |t| and the smaller the p-value.",
    mlExample: {
      scenario: "You've trained two versions of a recommendation model and want to know if Model B genuinely produces longer average watch-time per session than Model A, based on a holdout evaluation.",
      data: "Model A: mean watch-time 24.1 min (n=400). Model B: mean watch-time 26.8 min (n=400). t = 2.91, p = 0.004.",
      conclusion: "Reject H0 — Model B's improvement is statistically significant, not just noise. This justifies shipping Model B rather than running a much costlier full A/B test, or strengthens the case for one."
    },
    prosCons: {
      pros: ["Very interpretable — directly compares means in original units", "High statistical power when assumptions hold", "Fast, closed-form, no resampling needed"],
      cons: ["Sensitive to outliers since it relies on the mean", "Invalid conclusions if normality or variance assumptions are badly violated and sample size is small"]
    },
    related: "mannwhitney",
    relatedLabel: "Non-parametric counterpart: Mann-Whitney U"
  },
  {
    id: "mannwhitney",
    name: "Mann-Whitney U Test",
    short: "Mann-Whitney U",
    category: "Compare 2 Groups",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "The rank-based alternative to the t-test for comparing two independent groups, no normality required.",
    definition: "Mann-Whitney U (also called the Wilcoxon rank-sum test) compares two independent groups without assuming normality. Instead of comparing means, it pools both groups, ranks every observation, and checks whether one group's ranks tend to be systematically higher or lower than the other's. It's really asking: if I picked one random observation from each group, how often would group A's value beat group B's?",
    hypotheses: {
      h0: "The two distributions are equal — a random observation from group A is equally likely to be larger or smaller than one from group B.",
      h1: "One group tends to produce larger values than the other (a shift in distribution)."
    },
    assumptions: [
      "Outcome is at least ordinal (can be ranked)",
      "The two groups are independent",
      "No assumption of normality, but assumes the two distributions have similar shape if you want to interpret it as comparing medians"
    ],
    whenToUse: "Use this whenever you'd want an independent t-test but the data is skewed, has heavy outliers, or is ordinal (e.g. satisfaction ratings 1-5) rather than truly continuous. Very common with metrics like revenue, latency, or time-on-page, which are almost never normal in the wild.",
    statisticIdea: "Rank all observations from both groups together. U is based on the sum of ranks in one group — a heavily lopsided rank sum means one group's values are systematically larger.",
    mlExample: {
      scenario: "You want to compare model inference latency (in ms) between two serving infrastructures. Latency data is famously right-skewed with occasional huge spikes, so a t-test's normality assumption is shaky.",
      data: "Infra A median latency 42ms (n=1000), Infra B median latency 38ms (n=1000). Mann-Whitney U, p = 0.001.",
      conclusion: "Reject H0 — Infra B is genuinely faster, and because the test is rank-based, a handful of extreme latency spikes didn't distort the conclusion the way they would have with a t-test on raw means."
    },
    prosCons: {
      pros: ["Robust to outliers and skew", "Works on ordinal data where means don't make sense", "Nearly as powerful as the t-test even when data IS normal — small efficiency cost for a lot of safety"],
      cons: ["Tests for a general distributional shift, not strictly 'difference in means' — interpretation is less direct", "Loses some statistical power compared to t-test when data truly is normal"]
    },
    related: "ttest_ind",
    relatedLabel: "Parametric counterpart: Independent t-test"
  },
  {
    id: "ttest_paired",
    name: "Paired Samples t-test",
    short: "Paired t-test",
    category: "Compare 2 Related Samples",
    type: "parametric",
    rail: "parametric",
    oneLiner: "Compares two measurements taken on the same subjects — e.g. before vs after.",
    definition: "The paired t-test handles the case where your two samples aren't independent — they're two measurements on the same units, like the same users before and after a feature launch, or the same model evaluated on metric X and metric Y. It works by computing the difference for each pair, then running a one-sample t-test on those differences against zero.",
    hypotheses: {
      h0: "The mean difference between paired observations is zero.",
      h1: "The mean difference between paired observations is not zero."
    },
    assumptions: [
      "Observations are paired/matched (same subject, two time points or two conditions)",
      "The differences between pairs are approximately normally distributed (check with Shapiro-Wilk on the differences, not the raw values)"
    ],
    whenToUse: "Use whenever the same entity is measured twice — same users pre/post a UI change, same model on two different feature sets, same store before/after a pricing change. This is far more common in DS work than people realize, and using an independent t-test by mistake here wastes statistical power.",
    statisticIdea: "Compute d_i = x_i − y_i for each pair. Then t = mean(d) / (std(d)/√n). It's just a one-sample t-test on the differences.",
    mlExample: {
      scenario: "You retrained the same 200 users' churn-risk scores using an updated feature set and want to know if the new model's predicted risk is systematically different from the old model's, for the same users.",
      data: "Mean difference (new score − old score) = -0.031, t = -3.4, p = 0.0008.",
      conclusion: "Reject H0 — the new feature set systematically lowers predicted churn risk across the board, which could mean the new features are picking up genuinely lower-risk signals, or it could mean a calibration shift worth investigating before deployment."
    },
    prosCons: {
      pros: ["Removes between-subject variability, giving much higher statistical power than treating the pairs as independent", "Simple and directly interpretable as 'average change'"],
      cons: ["Requires a true pairing structure — misapplying it to unpaired data is a common, serious error", "Sensitive to outliers in the differences"]
    },
    related: "wilcoxon",
    relatedLabel: "Non-parametric counterpart: Wilcoxon signed-rank"
  },
  {
    id: "wilcoxon",
    name: "Wilcoxon Signed-Rank Test",
    short: "Wilcoxon Signed-Rank",
    category: "Compare 2 Related Samples",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "The rank-based alternative to the paired t-test, for when the paired differences aren't normal.",
    definition: "The Wilcoxon signed-rank test is the non-parametric version of the paired t-test. Instead of assuming the differences between pairs are normally distributed, it ranks the absolute differences and checks whether positive or negative differences dominate. It's testing whether the median difference is zero, not the mean.",
    hypotheses: {
      h0: "The median of the paired differences is zero.",
      h1: "The median of the paired differences is not zero."
    },
    assumptions: [
      "Observations are paired",
      "The differences are at least ordinal and symmetric around the median (a softer requirement than normality)"
    ],
    whenToUse: "Use this instead of the paired t-test when the differences between pairs are skewed or have outliers — for example, comparing revenue per user before and after a promotion, where a few whales can wreck a normality assumption.",
    statisticIdea: "Rank the absolute values of the differences, attach back the original sign, and sum the positive-ranked and negative-ranked values separately. A big imbalance between the two sums means a real shift.",
    mlExample: {
      scenario: "You're comparing the same set of 150 products' click-through-rate predictions from two ranking models (a same-products, two-models pairing). CTR predictions are bounded between 0 and 1 and tend to cluster near small values — not normal.",
      data: "Wilcoxon signed-rank test on (Model B prediction − Model A prediction), W = 1820, p = 0.031.",
      conclusion: "Reject H0 — Model B's predictions are systematically different from Model A's for the same products, even though the raw differences were too skewed to trust a paired t-test's normality assumption."
    },
    prosCons: {
      pros: ["Robust to non-normal, skewed, or outlier-heavy difference distributions", "Still uses the pairing structure, so retains good statistical power"],
      cons: ["Assumes the distribution of differences is roughly symmetric — if it's heavily asymmetric, results can mislead", "Tests medians, which can feel less intuitive to stakeholders used to thinking in averages"]
    },
    related: "ttest_paired",
    relatedLabel: "Parametric counterpart: Paired t-test"
  },
  {
    id: "anova",
    name: "One-Way ANOVA",
    short: "One-Way ANOVA",
    category: "Compare 3+ Groups",
    type: "parametric",
    rail: "parametric",
    oneLiner: "Compares the means of three or more independent groups in one single test.",
    definition: "One-way ANOVA (Analysis of Variance) extends the t-test to three or more groups. Rather than running multiple pairwise t-tests (which inflates your false-positive rate), it asks a single question: is there more variation *between* group means than we'd expect from the variation *within* each group? It produces an F-statistic, the ratio of between-group to within-group variance.",
    hypotheses: {
      h0: "All group means are equal (μ1 = μ2 = ... = μk).",
      h1: "At least one group mean differs from the others."
    },
    assumptions: [
      "Outcome variable is continuous",
      "Groups are independent",
      "Each group is approximately normally distributed",
      "Equal variances across groups (homoscedasticity — check with Levene's test)"
    ],
    whenToUse: "Use when comparing a continuous metric across 3+ independent groups simultaneously — e.g. average order value across four marketing channels. A significant ANOVA tells you *some* difference exists; follow up with post-hoc tests (like Tukey's HSD) to find out *which* groups differ.",
    statisticIdea: "F = (variance between group means) / (variance within groups). A large F means the groups are more spread out from each other than the natural noise within each group would predict.",
    mlExample: {
      scenario: "You're feature-selecting for a regression model and want to know if a categorical feature, region (5 categories), has any real relationship with the continuous target, customer_spend.",
      data: "One-way ANOVA of customer_spend across 5 regions: F(4, 995) = 8.7, p < 0.001.",
      conclusion: "Reject H0 — region explains real variance in spend, so it's a candidate feature worth encoding (one-hot or target encoding) rather than dropping, and you'd follow up with Tukey's HSD to see which specific regions differ."
    },
    prosCons: {
      pros: ["Tests multiple groups in one shot, controlling overall false-positive rate better than repeated t-tests", "Well-understood, fast, and directly usable for feature screening"],
      cons: ["A significant result only tells you SOME group differs, not which one — needs a post-hoc test", "Just as sensitive to non-normality and unequal variance as the t-test"]
    },
    related: "kruskal",
    relatedLabel: "Non-parametric counterpart: Kruskal-Wallis"
  },
  {
    id: "kruskal",
    name: "Kruskal-Wallis H Test",
    short: "Kruskal-Wallis",
    category: "Compare 3+ Groups",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "The rank-based alternative to one-way ANOVA for comparing three or more groups.",
    definition: "Kruskal-Wallis is the non-parametric counterpart to one-way ANOVA. It pools all groups together, ranks every observation, and tests whether the average rank differs meaningfully across groups — without ever assuming the underlying data is normally distributed.",
    hypotheses: {
      h0: "All groups come from the same distribution (equal medians, roughly).",
      h1: "At least one group's distribution differs from the others."
    },
    assumptions: [
      "Outcome is at least ordinal",
      "Groups are independent",
      "No normality assumption required, but groups should have similarly-shaped distributions for a clean median interpretation"
    ],
    whenToUse: "Use when comparing 3+ independent groups on a skewed or ordinal metric — for example, comparing model latency across four different hardware configurations, where latency is almost always right-skewed.",
    statisticIdea: "Rank all observations across all groups together, then compute a statistic (H) based on how far each group's average rank is from the overall average rank — conceptually an ANOVA F-test performed on ranks instead of raw values.",
    mlExample: {
      scenario: "You want to compare prediction error (absolute error) across three different model architectures evaluated on the same test set split into independent folds. Errors are right-skewed with a long tail of hard examples.",
      data: "Kruskal-Wallis H = 11.4, df = 2, p = 0.003.",
      conclusion: "Reject H0 — at least one architecture's error distribution differs from the others. You'd follow up with a post-hoc pairwise test (e.g. Dunn's test with correction) to identify which architecture actually wins."
    },
    prosCons: {
      pros: ["Robust to skew and outliers, common in latency, cost, and error metrics", "No normality assumption, broadly applicable"],
      cons: ["Like ANOVA, a significant result doesn't say which groups differ — needs a post-hoc test (e.g. Dunn's test)", "Slightly less statistical power than ANOVA when data genuinely is normal"]
    },
    related: "anova",
    relatedLabel: "Parametric counterpart: One-Way ANOVA"
  },
  {
    id: "chisquare",
    name: "Chi-Square Test of Independence",
    short: "Chi-Square Test",
    category: "Categorical Association",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "Tests whether two categorical variables are associated, e.g. device type and conversion outcome.",
    definition: "The chi-square test of independence checks whether two categorical variables are related, by comparing the actual counts in a contingency table against the counts you'd expect if the variables were completely unrelated (independent). Large gaps between observed and expected counts produce a large chi-square statistic.",
    hypotheses: {
      h0: "The two categorical variables are independent (no association).",
      h1: "The two categorical variables are associated."
    },
    assumptions: [
      "Both variables are categorical",
      "Observations are independent",
      "Expected cell counts should generally be ≥ 5 in at least 80% of cells — if violated, use Fisher's exact test instead"
    ],
    whenToUse: "Use this to check whether a categorical feature has a real relationship with a categorical target before including it in a classification model — e.g. is browser_type associated with whether a user converts?",
    statisticIdea: "χ² = Σ (Observed − Expected)² / Expected, summed across every cell of the contingency table. The bigger the mismatch between what you observed and what independence would predict, the larger χ².",
    mlExample: {
      scenario: "You're building a churn classifier and want to know whether subscription_plan (Basic/Pro/Enterprise) is meaningfully associated with churned (Yes/No) before engineering it into the model.",
      data: "3x2 contingency table of plan vs churn. χ²(2) = 24.6, p < 0.001.",
      conclusion: "Reject H0 — subscription plan and churn are associated. This is a strong signal to keep and properly encode this feature, and worth a follow-up look at which specific plan drives the effect."
    },
    prosCons: {
      pros: ["Simple, fast, and works on any size contingency table, not just 2x2", "Extremely common first-pass feature-target association check for categorical features"],
      cons: ["Needs reasonably large expected cell counts to be valid — small or sparse tables give unreliable p-values", "Only tells you association exists, not its strength or direction — pair with Cramér's V for effect size"]
    },
    related: "fisher",
    relatedLabel: "Small-sample alternative: Fisher's Exact Test"
  },
  {
    id: "fisher",
    name: "Fisher's Exact Test",
    short: "Fisher's Exact Test",
    category: "Categorical Association",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "The exact version of the chi-square test, built for small sample sizes or sparse tables.",
    definition: "Fisher's exact test answers the same question as the chi-square test — are two categorical variables associated — but computes an exact p-value from the hypergeometric distribution instead of relying on a large-sample approximation. It doesn't need the 'expected count ≥ 5' rule that chi-square depends on.",
    hypotheses: {
      h0: "The two categorical variables are independent (no association).",
      h1: "The two categorical variables are associated."
    },
    assumptions: [
      "Originally derived for 2x2 tables (extensions exist for larger tables but get computationally expensive)",
      "Row and column totals are treated as fixed",
      "Observations are independent"
    ],
    whenToUse: "Use this instead of chi-square whenever your contingency table is small or sparse — a very common situation in early-stage A/B tests, rare-event classification (fraud, disease, defect detection), or any segment with low sample counts.",
    statisticIdea: "Directly calculates the probability of observing a table this extreme (or more extreme), given the fixed row and column totals, using the hypergeometric distribution — no approximation involved.",
    mlExample: {
      scenario: "You're A/B testing a new onboarding flow but only 40 users have gone through it so far. You want to know if completion rate differs from the old flow (60 users), and several cells in your 2x2 table have counts under 5.",
      data: "2x2 table: New flow 18/40 completed, Old flow 22/60 completed. Fisher's exact test p = 0.21.",
      conclusion: "Fail to reject H0 — no significant association detected yet between flow version and completion, but given the small sample, this is also a signal to keep collecting data rather than conclude 'no effect' too early."
    },
    prosCons: {
      pros: ["Exact p-value, valid even with very small or sparse samples where chi-square breaks down", "No reliance on large-sample approximations"],
      cons: ["Computationally expensive to extend beyond 2x2 tables", "Can be overly conservative (low power) in some midsize-sample cases"]
    },
    related: "chisquare",
    relatedLabel: "Large-sample alternative: Chi-Square Test"
  },
  {
    id: "pearson",
    name: "Pearson Correlation",
    short: "Pearson Correlation",
    category: "Correlation",
    type: "parametric",
    rail: "parametric",
    oneLiner: "Measures the strength and direction of a linear relationship between two continuous variables.",
    definition: "Pearson's correlation coefficient (r) measures how strongly two continuous variables move together in a straight-line fashion, ranging from -1 (perfect negative linear relationship) to +1 (perfect positive linear relationship), with 0 meaning no linear relationship. The hypothesis test attached to it checks whether the observed correlation is significantly different from zero.",
    hypotheses: {
      h0: "The true population correlation is zero (ρ = 0) — no linear relationship.",
      h1: "The true population correlation is not zero (ρ ≠ 0)."
    },
    assumptions: [
      "Both variables are continuous",
      "Both variables are approximately normally distributed",
      "The relationship between them, if any, is linear",
      "Sensitive to outliers, which can dramatically inflate or deflate r"
    ],
    whenToUse: "Use during EDA to screen for linear relationships between continuous features, or between a feature and a continuous target, before building a linear model. Also the standard tool for checking multicollinearity between features.",
    statisticIdea: "r = covariance(X, Y) / (std(X) × std(Y)). It's a standardized measure of how much two variables co-vary.",
    mlExample: {
      scenario: "Before building a linear regression to predict house price, you check whether square_footage and price have a strong linear relationship worth relying on.",
      data: "Pearson r = 0.78, n = 800, p < 0.001.",
      conclusion: "Reject H0 — a strong, statistically significant positive linear relationship exists. square_footage is confirmed as a strong linear predictor candidate. You'd also check Pearson correlation between all your features to flag multicollinearity risks."
    },
    prosCons: {
      pros: ["Highly interpretable single number capturing strength and direction", "Foundational to linear regression, PCA, and most linear ML methods"],
      cons: ["Only captures linear relationships — can completely miss strong non-linear or monotonic patterns", "Very sensitive to outliers and skewed data"]
    },
    related: "spearman",
    relatedLabel: "Non-parametric counterpart: Spearman Correlation"
  },
  {
    id: "spearman",
    name: "Spearman Rank Correlation",
    short: "Spearman Correlation",
    category: "Correlation",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "Measures the strength of a monotonic (not necessarily linear) relationship between two variables, using ranks.",
    definition: "Spearman's rank correlation (ρ, 'rho') is Pearson's correlation computed on the *ranks* of the data rather than the raw values. This means it captures any monotonic relationship — consistently increasing or decreasing, even if curved — not just straight-line ones, and it's far less sensitive to outliers and skew.",
    hypotheses: {
      h0: "There is no monotonic relationship between the two variables (ρ = 0).",
      h1: "There is a monotonic relationship between the two variables (ρ ≠ 0)."
    },
    assumptions: [
      "Variables are at least ordinal (can be ranked)",
      "The relationship, if present, is assumed to be monotonic — Spearman won't capture a U-shaped relationship either",
      "No normality requirement"
    ],
    whenToUse: "Use this when you suspect a relationship exists but it might be curved rather than straight-line, when your variables are ordinal (e.g. star ratings), or when outliers make Pearson unreliable. Very common for evaluating ranking-quality metrics in recommender systems.",
    statisticIdea: "Convert both variables to ranks, then compute Pearson's correlation formula on those ranks instead of the raw values.",
    mlExample: {
      scenario: "You want to check whether your model's predicted relevance score actually produces a sensible ordering compared to true user engagement, even though the relationship between the two isn't perfectly linear (e.g. it saturates at high scores).",
      data: "Spearman ρ = 0.71, n = 500, p < 0.001.",
      conclusion: "Reject H0 — a strong monotonic relationship exists between predicted score and actual engagement, confirming the model ranks items sensibly even where the raw scores aren't linearly related to engagement."
    },
    prosCons: {
      pros: ["Captures non-linear (but monotonic) relationships that Pearson would miss", "Robust to outliers since it works on ranks", "Works on ordinal data, not just continuous"],
      cons: ["Misses non-monotonic relationships (e.g. U-shaped curves) entirely", "Slightly less statistically efficient than Pearson when the relationship really is linear and data is well-behaved"]
    },
    related: "pearson",
    relatedLabel: "Parametric counterpart: Pearson Correlation"
  },
  {
    id: "ztest_prop",
    name: "Two-Proportion Z-Test",
    short: "Two-Proportion Z-Test",
    category: "A/B & Proportions",
    type: "parametric",
    rail: "parametric",
    oneLiner: "The standard test for comparing conversion rates between two groups — the workhorse of A/B testing.",
    definition: "The two-proportion z-test compares the proportion of 'successes' (conversions, clicks, sign-ups) between two independent groups, such as a treatment and control group in an A/B test. It checks whether the observed difference in conversion rate is bigger than you'd expect from random sampling noise alone.",
    hypotheses: {
      h0: "The two groups have equal true conversion rates (p1 = p2).",
      h1: "The two groups have different true conversion rates (p1 ≠ p2)."
    },
    assumptions: [
      "Outcome is binary (converted / not converted)",
      "Groups are independent random samples",
      "Sample sizes large enough that np and n(1-p) are both ≥ 5 for each group (otherwise consider Fisher's exact test)"
    ],
    whenToUse: "This is the default significance test for A/B testing conversion-style metrics: click-through rate, sign-up rate, purchase rate. If your sample is small or your conversion rate is very low (rare events), switch to Fisher's exact test instead.",
    statisticIdea: "z = (p1_hat − p2_hat) / standard_error_of_the_difference, where the standard error is calculated from a pooled estimate of the conversion rate under H0.",
    mlExample: {
      scenario: "You've deployed a new recommendation algorithm to 50% of traffic and want to know if it increased the add-to-cart rate compared to the old algorithm.",
      data: "Control: 1,240 / 20,000 added to cart (6.2%). Treatment: 1,380 / 20,000 added to cart (6.9%). z = 2.85, p = 0.0044.",
      conclusion: "Reject H0 — the new algorithm produces a statistically significant lift in add-to-cart rate, supporting a full rollout decision (alongside a sanity check on practical/business significance, since statistical significance alone isn't the whole story)."
    },
    prosCons: {
      pros: ["The standard, well-understood tool for A/B test conversion metrics", "Fast to compute, easy to build into a dashboard or pipeline with confidence intervals attached"],
      cons: ["Unreliable for very low conversion rates or small samples — check the np ≥ 5 rule", "A statistically significant lift isn't automatically a practically meaningful one — always pair with effect size and business context"]
    },
    related: "fisher",
    relatedLabel: "Small-sample alternative: Fisher's Exact Test"
  },
  {
    id: "ztest_one_sample",
    name: "One-Sample Z-Test",
    short: "One-Sample Z-Test",
    category: "One Sample",
    type: "parametric",
    rail: "parametric",
    oneLiner: "Compares a sample mean against a known target value, when the population standard deviation is already known.",
    definition: "The one-sample z-test checks whether a sample's mean differs from a known or hypothesized population value, using the population standard deviation (not the sample's estimate of it) to compute the standard error. Knowing the true population SD in advance is rare in practice — this test mostly shows up when working with well-characterized instruments, calibrated systems, or very large historical datasets where the SD is treated as known.",
    hypotheses: {
      h0: "The population mean equals the hypothesized value (μ = μ₀).",
      h1: "The population mean differs from the hypothesized value (μ ≠ μ₀)."
    },
    assumptions: [
      "The population standard deviation is known in advance (not estimated from this sample)",
      "Data is continuous",
      "Observations are independent",
      "Sample is reasonably normal, or n is large enough for the CLT to apply"
    ],
    whenToUse: "Use when you have a calibrated, well-understood metric with a known historical standard deviation, and want to check if a new sample's mean has shifted from that baseline. In ML contexts this shows up when monitoring a model output whose noise characteristics are well established from years of production data.",
    statisticIdea: "z = (sample_mean − μ₀) / (population_SD / √n). Standardizes the gap between observed and hypothesized mean using a known noise level.",
    mlExample: {
      scenario: "Your fraud model outputs a daily aggregate risk score, and over 3 years of production you know the population standard deviation of this score is stable at 4.2. You want to check if this week's average score (n=7 days) has shifted from the long-run baseline of 50.",
      data: "Sample mean = 53.1, μ₀ = 50, population SD = 4.2, n = 7. z = 1.95, p = 0.051.",
      conclusion: "Borderline — fail to reject H0 at the 0.05 level, but close enough to flag for a longer observation window before concluding the model's risk scoring has drifted."
    },
    prosCons: {
      pros: ["Exact (not approximate) when the population SD truly is known", "Simple, fast, closed-form"],
      cons: ["Requires a known population SD, which is rare outside calibrated industrial or long-running production settings — when in doubt, use the one-sample t-test instead", "Sensitive to the population-SD assumption being wrong"]
    },
    related: "ttest_one_sample",
    relatedLabel: "When SD is unknown: One-Sample t-test"
  },
  {
    id: "ttest_one_sample",
    name: "One-Sample t-test",
    short: "One-Sample t-test",
    category: "One Sample",
    type: "parametric",
    rail: "parametric",
    oneLiner: "Compares a sample mean against a known target value, estimating the standard deviation from the sample itself.",
    definition: "The one-sample t-test checks whether a sample's mean differs significantly from a hypothesized value, exactly like the one-sample z-test, but it estimates the standard deviation from the sample data rather than assuming it's already known. This makes it the realistic default for almost any 'does this sample match a target value' question.",
    hypotheses: {
      h0: "The population mean equals the hypothesized value (μ = μ₀).",
      h1: "The population mean differs from the hypothesized value (μ ≠ μ₀)."
    },
    assumptions: [
      "Data is continuous",
      "Observations are independent",
      "The sample is approximately normally distributed (check with Shapiro-Wilk), especially important for small n"
    ],
    whenToUse: "Use whenever you want to check a sample's mean against a fixed benchmark — a target SLA, a regulatory threshold, an expected baseline — and you don't have a separately known population standard deviation (the normal case).",
    statisticIdea: "t = (sample_mean − μ₀) / (sample_SD / √n). Same idea as the z-test, but the standard error comes from the sample, which adds extra uncertainty captured by the t-distribution's fatter tails.",
    mlExample: {
      scenario: "Your team has an SLA that model inference latency should average 100ms. You want to check whether a new model build's latency, measured over 50 requests, actually meets that target.",
      data: "Sample mean latency = 108ms, sample SD = 22ms, n = 50, μ₀ = 100. t = 2.57, p = 0.013.",
      conclusion: "Reject H0 — the new build's average latency is significantly above the 100ms target, which is a blocker for release until the regression is investigated."
    },
    prosCons: {
      pros: ["The realistic, default choice for any 'sample vs. fixed target' question", "Works well even with moderate departures from normality once n is reasonably large"],
      cons: ["Less powerful than the z-test when the population SD truly is known (rare)", "Sensitive to outliers since it relies on the sample mean and SD"]
    },
    related: "wilcoxon_one_sample",
    relatedLabel: "Non-parametric counterpart: Wilcoxon Signed-Rank (1-sample)"
  },
  {
    id: "wilcoxon_one_sample",
    name: "Wilcoxon Signed-Rank Test (One-Sample)",
    short: "Wilcoxon (1-sample)",
    category: "One Sample",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "The non-parametric alternative to the one-sample t-test, for comparing a sample's median against a target value.",
    definition: "In its one-sample form, the Wilcoxon signed-rank test checks whether a sample's median differs from a hypothesized value, without assuming the data is normally distributed. It computes each observation's deviation from the hypothesized value, ranks the absolute deviations, and checks whether positive or negative deviations dominate.",
    hypotheses: {
      h0: "The population median equals the hypothesized value.",
      h1: "The population median differs from the hypothesized value."
    },
    assumptions: [
      "Data is at least ordinal",
      "Observations are independent",
      "The distribution of deviations from the hypothesized value is roughly symmetric"
    ],
    whenToUse: "Use this instead of the one-sample t-test when your data is skewed or has outliers relative to the target you're testing against — common with cost, latency, or revenue metrics compared against a fixed benchmark.",
    statisticIdea: "Compute each point's signed deviation from the hypothesized value, rank the absolute deviations, then compare the sum of positive-ranked vs negative-ranked deviations.",
    mlExample: {
      scenario: "You want to check whether the median absolute error of a new pricing model differs from a contractual target of $2.00, but error values are heavily right-skewed by a handful of badly mispriced items.",
      data: "n = 80 absolute errors, hypothesized median = $2.00. Wilcoxon signed-rank test, p = 0.04.",
      conclusion: "Reject H0 — the model's median error differs significantly from the $2.00 target, and because the test is rank-based, the few extreme mispricing outliers didn't dominate the conclusion the way they would have with a t-test."
    },
    prosCons: {
      pros: ["Robust to skew and outliers relative to the t-test", "No normality assumption required"],
      cons: ["Requires roughly symmetric deviations around the target to interpret cleanly as a median test", "Less statistical power than the t-test when data really is normal"]
    },
    related: "ttest_one_sample",
    relatedLabel: "Parametric counterpart: One-Sample t-test"
  },
  {
    id: "mcnemar",
    name: "McNemar's Test",
    short: "McNemar's Test",
    category: "Paired Categorical",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "Compares two related binary outcomes on the same subjects — the categorical equivalent of a paired t-test.",
    definition: "McNemar's test checks whether the proportion of a binary outcome changed between two paired measurements on the same subjects — for example, the same set of users classified as 'converted' or 'not converted' before and after a change. It focuses only on the cases that switched category, ignoring subjects whose outcome stayed the same in both measurements.",
    hypotheses: {
      h0: "The proportion of subjects switching from category A to B equals the proportion switching from B to A (no systematic change).",
      h1: "There's a systematic shift in one direction (more switch A→B than B→A, or vice versa)."
    },
    assumptions: [
      "The same subjects are measured twice (paired design)",
      "The outcome is binary (or can be collapsed into two categories)",
      "Observations are independent across subjects (but the two measurements per subject are, by design, dependent)"
    ],
    whenToUse: "Use when you have a binary classification outcome measured twice on the same set of subjects — e.g. did the same group of users churn before vs after a retention campaign, or did the same set of support tickets get marked 'resolved' under an old vs new triage model.",
    statisticIdea: "Build a 2x2 table of paired outcomes, then test based only on the off-diagonal cells (the cases that flipped category) — roughly a chi-square test restricted to the discordant pairs.",
    mlExample: {
      scenario: "You want to know if a new content-moderation model classifies the same 500 borderline posts differently than the old model — specifically, whether it flags more posts as violating policy than it clears, compared to the old model's calls on the same posts.",
      data: "Of 500 posts: 40 flipped from 'cleared' (old) to 'flagged' (new); 12 flipped the other way. McNemar's χ² = 14.7, p < 0.001.",
      conclusion: "Reject H0 — the new model systematically flags more borderline posts than the old one on the exact same content, which is a meaningful behavior shift worth reviewing before rollout, independent of overall accuracy metrics."
    },
    prosCons: {
      pros: ["Directly designed for paired binary data, which a regular chi-square test handles incorrectly", "Simple 2x2 table, easy to compute and explain to stakeholders"],
      cons: ["Only applies to binary (or binarized) outcomes", "Ignores the concordant pairs entirely, which can feel like 'wasting' data even though it's statistically correct"]
    },
    related: "chisquare",
    relatedLabel: "Unpaired counterpart: Chi-Square Test of Independence"
  },
  {
    id: "friedman",
    name: "Friedman Test",
    short: "Friedman Test",
    category: "Paired 3+ Groups",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "Compares three or more related (repeated-measures) samples — the non-parametric counterpart to a repeated-measures ANOVA.",
    definition: "The Friedman test checks whether three or more related samples — typically the same subjects measured under three or more conditions — differ, without assuming normality. It ranks the conditions within each subject and tests whether the average rank differs meaningfully across conditions.",
    hypotheses: {
      h0: "All conditions/treatments produce the same distribution of outcomes (no systematic ranking difference).",
      h1: "At least one condition systematically produces higher or lower ranks than the others."
    },
    assumptions: [
      "The same subjects (or matched blocks) are measured under 3+ related conditions",
      "The outcome is at least ordinal",
      "No normality assumption required"
    ],
    whenToUse: "Use when comparing 3+ related, repeated measurements on the same subjects and the data is skewed, ordinal, or has outliers — for example, the same set of users rating their satisfaction with three different versions of an interface.",
    statisticIdea: "Rank the conditions within each subject (e.g. 1st, 2nd, 3rd best), then test whether the average rank per condition differs more than chance across all subjects.",
    mlExample: {
      scenario: "You show the same 60 users three different ranked-recommendation algorithms (in randomized order) and record a satisfaction score (1-10) for each. You want to know if the algorithms differ in perceived quality.",
      data: "Friedman test across 3 algorithms, n = 60 users. χ² = 9.8, df = 2, p = 0.007.",
      conclusion: "Reject H0 — at least one algorithm is rated systematically differently by the same users. Follow up with a post-hoc pairwise test (e.g. pairwise Wilcoxon with correction) to identify which algorithm wins."
    },
    prosCons: {
      pros: ["Handles repeated-measures designs that a regular Kruskal-Wallis test would handle incorrectly", "Robust to skew and outliers, no normality assumption"],
      cons: ["A significant result doesn't say which conditions differ — needs a post-hoc test", "Requires the same subjects measured in all conditions; missing data per subject is a problem"]
    },
    related: "anova",
    relatedLabel: "Parametric repeated-measures equivalent: (Repeated-Measures ANOVA)"
  },
  {
    id: "ztest_two_sample",
    name: "Two-Sample Z-Test",
    short: "Two-Sample Z-Test",
    category: "Compare 2 Groups",
    type: "parametric",
    rail: "parametric",
    oneLiner: "Compares the means of two independent groups when the population standard deviations of both groups are already known.",
    definition: "The two-sample z-test compares the means of two independent groups, like the independent t-test, but it uses known population standard deviations rather than estimating them from the samples. Because true population SDs are rarely known with certainty, this test is most relevant for well-calibrated measurement systems or very large reference datasets.",
    hypotheses: {
      h0: "The two population means are equal (μ1 = μ2).",
      h1: "The two population means are different (μ1 ≠ μ2)."
    },
    assumptions: [
      "Population standard deviations of both groups are known in advance",
      "The two groups are independent",
      "Data is continuous, or n is large enough for the CLT to apply"
    ],
    whenToUse: "Use only when you have well-established, known population standard deviations for both groups being compared — for example, two sensor batches from a manufacturer with long, stable calibration histories. If you're estimating the SDs from your own sample (the common case), use the independent t-test instead.",
    statisticIdea: "z = (mean1 − mean2) / sqrt(SD1²/n1 + SD2²/n2), using known population SDs rather than sample estimates.",
    mlExample: {
      scenario: "You operate two data-collection pipelines whose sensor noise characteristics are extremely well characterized from years of calibration (population SD known for each). You want to check if pipeline A's average reading differs from pipeline B's on a new batch.",
      data: "Pipeline A mean = 14.2 (known SD = 1.1, n=200), Pipeline B mean = 14.6 (known SD = 1.3, n=200). z = 3.3, p < 0.001.",
      conclusion: "Reject H0 — a real difference between pipelines exists, not just calibration noise, prompting a check for a systematic offset between the two sensor batches."
    },
    prosCons: {
      pros: ["Exact when population SDs truly are known", "Simple and fast to compute"],
      cons: ["Rarely applicable in practice since population SDs are usually unknown — defaults to the independent t-test in almost all real DS work", "Wrong population-SD assumptions invalidate the result"]
    },
    related: "ttest_ind",
    relatedLabel: "When SD is unknown: Independent t-test"
  },
  {
    id: "welch_anova",
    name: "Welch's ANOVA",
    short: "Welch's ANOVA",
    category: "Compare 3+ Groups",
    type: "parametric",
    rail: "parametric",
    oneLiner: "A version of one-way ANOVA that doesn't assume equal variances across groups.",
    definition: "Welch's ANOVA tests whether three or more group means differ, just like one-way ANOVA, but it adjusts the calculation so it remains valid when the groups have unequal variances — the exact situation where standard ANOVA's results become unreliable. It still assumes each group is roughly normally distributed.",
    hypotheses: {
      h0: "All group means are equal (μ1 = μ2 = ... = μk).",
      h1: "At least one group mean differs from the others."
    },
    assumptions: [
      "Outcome variable is continuous",
      "Groups are independent",
      "Each group is approximately normally distributed",
      "Does NOT require equal variances across groups — this is the whole point of using it over standard ANOVA"
    ],
    whenToUse: "Use this instead of standard one-way ANOVA whenever Levene's test indicates the groups have unequal variances but each group still looks reasonably normal. It's a safer default than standard ANOVA in many real datasets, since equal variance is a fairly strong assumption that's often violated.",
    statisticIdea: "Like ANOVA's F-statistic, but it weights each group's contribution by the inverse of its own variance, instead of pooling all groups into one shared variance estimate.",
    mlExample: {
      scenario: "You're comparing average order value across four customer acquisition channels for a marketing-attribution analysis. Channel sample sizes and spending variability differ a lot (paid search customers have wildly different order sizes than referral customers).",
      data: "Levene's test flags unequal variances (p = 0.002). Welch's ANOVA: F(3, 410.2) = 7.9, p < 0.001.",
      conclusion: "Reject H0 — channels differ significantly in average order value, and because Welch's correction was used, this conclusion is trustworthy despite the variance imbalance that would have made standard ANOVA's p-value suspect."
    },
    prosCons: {
      pros: ["Robust to unequal variances, a very common real-world violation of standard ANOVA's assumptions", "Nearly as powerful as standard ANOVA when variances actually are equal, so there's little downside to defaulting to it"],
      cons: ["Still assumes each group is roughly normal — switch to Kruskal-Wallis if that fails too", "A significant result still doesn't say which groups differ — needs a post-hoc test suited for unequal variances (e.g. Games-Howell)"]
    },
    related: "anova",
    relatedLabel: "Equal-variance counterpart: One-Way ANOVA"
  },
  {
    id: "twoway_anova",
    name: "Two-Way ANOVA",
    short: "Two-Way ANOVA",
    category: "Compare 3+ Groups",
    type: "parametric",
    rail: "parametric",
    oneLiner: "Tests the effect of two categorical factors on a continuous outcome at once — including whether they interact.",
    definition: "Two-way ANOVA extends one-way ANOVA to handle two categorical factors simultaneously, such as marketing channel AND device type affecting conversion value. It tests three things at once: the main effect of factor 1, the main effect of factor 2, and the interaction effect — whether the impact of one factor depends on the level of the other.",
    hypotheses: {
      h0: "No main effect of factor 1, no main effect of factor 2, and no interaction effect between them (three separate null hypotheses, tested simultaneously).",
      h1: "At least one of these effects (factor 1, factor 2, or their interaction) is non-zero."
    },
    assumptions: [
      "Outcome variable is continuous",
      "Both factors are categorical",
      "Each cell (combination of factor levels) is approximately normally distributed",
      "Equal variances across all cells (homoscedasticity)",
      "Ideally balanced or near-balanced group sizes across all factor-level combinations"
    ],
    whenToUse: "Use when you suspect two categorical features jointly affect a continuous outcome, and you specifically care about whether they interact — e.g. does the effect of a UI redesign on engagement depend on whether the user is on mobile vs desktop.",
    statisticIdea: "Decomposes total variance into: variance explained by factor 1, by factor 2, by their interaction, and leftover within-group variance — producing a separate F-statistic for each of the three effects.",
    mlExample: {
      scenario: "You're analyzing how both onboarding_flow (A/B) and device_type (mobile/desktop) affect first_week_revenue, and specifically want to know if the onboarding flow's effect differs by device.",
      data: "Two-way ANOVA: main effect of flow F=5.2 (p=0.02), main effect of device F=1.1 (p=0.29), interaction F=8.4 (p=0.004).",
      conclusion: "The significant interaction means the new onboarding flow doesn't help (or hurt) uniformly — its effect on revenue depends on device type, so a blanket rollout decision should be split by device segment rather than applied universally."
    },
    prosCons: {
      pros: ["Captures interaction effects that running two separate one-way ANOVAs would completely miss", "Efficient — tests two factors and their interaction in a single model"],
      cons: ["Requires roughly balanced group sizes for cleanest interpretation; unbalanced designs need careful handling", "More assumptions to satisfy (normality and equal variance in every cell), and harder to diagnose when violated"]
    },
    related: "anova",
    relatedLabel: "Single-factor version: One-Way ANOVA"
  },
  {
    id: "tukey_hsd",
    name: "Tukey's HSD",
    short: "Tukey's HSD",
    category: "Post-Hoc Test",
    type: "parametric",
    rail: "parametric",
    oneLiner: "The standard post-hoc test after a significant one-way ANOVA — finds exactly which group pairs differ.",
    definition: "Tukey's Honestly Significant Difference (HSD) test runs after a significant ANOVA to identify which specific pairs of groups differ, while controlling the overall (family-wise) false-positive rate across all pairwise comparisons. It's the standard 'now that ANOVA says something differs, which groups exactly?' follow-up.",
    hypotheses: {
      h0: "For each pair of groups being compared: the two group means are equal.",
      h1: "For each pair: the two group means differ."
    },
    assumptions: [
      "Run only after a significant one-way ANOVA",
      "Same assumptions as ANOVA: normality within groups, equal variances across groups",
      "Works best with roughly equal group sizes (balanced design)"
    ],
    whenToUse: "Use immediately after a significant one-way ANOVA when group sizes are roughly balanced and variances are roughly equal, to pin down exactly which groups differ from which.",
    statisticIdea: "Compares every pair of group means using a studentized range distribution, which adjusts the critical value upward as more pairs are compared — keeping the overall false-positive rate at the target level (e.g. 5%) across all comparisons combined.",
    mlExample: {
      scenario: "Your one-way ANOVA found that average order value differs significantly across 4 marketing channels. Now you need to know exactly which channels differ from which, to decide where to shift ad spend.",
      data: "Tukey's HSD on all 6 pairwise channel comparisons: Paid Search vs Referral is significant (p=0.001, diff=$12.40); the other 5 pairs are not significant.",
      conclusion: "Only Paid Search and Referral differ meaningfully — the other channel pairs' apparent differences in the raw data were within noise. Budget conversations should focus specifically on the Paid Search vs Referral gap."
    },
    prosCons: {
      pros: ["Properly controls the family-wise error rate across all pairwise comparisons, unlike running many separate t-tests", "Gives both significance and an estimated effect size (mean difference) per pair"],
      cons: ["Assumes equal variances — use Games-Howell instead if that's violated", "Less powerful than a single ANOVA F-test since it's correcting for multiple comparisons"]
    },
    related: "anova",
    relatedLabel: "Runs after: One-Way ANOVA"
  },
  {
    id: "dunnett",
    name: "Dunnett's Test",
    short: "Dunnett's Test",
    category: "Post-Hoc Test",
    type: "parametric",
    rail: "parametric",
    oneLiner: "A post-hoc test that compares several treatment groups against a single control group, not against each other.",
    definition: "Dunnett's test is a post-hoc follow-up to ANOVA, like Tukey's HSD, but instead of comparing every group against every other group, it only compares each treatment group against one designated control group. This focused comparison set gives it more statistical power than Tukey's HSD when you don't actually care about treatment-vs-treatment comparisons.",
    hypotheses: {
      h0: "For each treatment group: its mean equals the control group's mean.",
      h1: "For each treatment group: its mean differs from the control group's mean."
    },
    assumptions: [
      "Run only after a significant one-way ANOVA",
      "One group must be clearly designated as the control/baseline",
      "Same normality and equal-variance assumptions as ANOVA"
    ],
    whenToUse: "Use instead of Tukey's HSD specifically when your design has a natural control group and you only care about each treatment's effect relative to that control — for example, several new model variants compared against the currently deployed production model.",
    statisticIdea: "Like Tukey's HSD, but the multiple-comparison correction only accounts for the (control vs treatment) comparisons actually made, not all possible pairwise comparisons — giving tighter, more powerful confidence intervals for the comparisons that matter.",
    mlExample: {
      scenario: "You've trained 4 candidate replacement models and want to know which, if any, significantly improve average revenue-per-user over the current production model, without caring whether the candidates differ from each other.",
      data: "One-way ANOVA significant (p<0.001). Dunnett's test vs production baseline: Candidate B p=0.002 (higher), Candidates A, C, D not significant.",
      conclusion: "Only Candidate B shows a statistically significant improvement over the current production model — that's the one worth the engineering cost of a full rollout."
    },
    prosCons: {
      pros: ["More statistical power than Tukey's HSD when you only care about control-vs-treatment comparisons", "Directly answers the 'is the new thing better than the baseline' question common in ML experimentation"],
      cons: ["Only valid for control-vs-treatment comparisons — doesn't tell you anything about treatment-vs-treatment differences", "Requires a clearly defined control group up front"]
    },
    related: "tukey_hsd",
    relatedLabel: "All-pairs alternative: Tukey's HSD"
  },
  {
    id: "dunn",
    name: "Dunn's Test",
    short: "Dunn's Test",
    category: "Post-Hoc Test",
    type: "nonparametric",
    rail: "nonparametric",
    oneLiner: "The post-hoc test after a significant Kruskal-Wallis result — finds which group pairs differ, using ranks.",
    definition: "Dunn's test is the non-parametric counterpart to Tukey's HSD. It runs after a significant Kruskal-Wallis test to identify which specific pairs of groups differ, using the rank-based approach consistent with Kruskal-Wallis, while correcting for the number of pairwise comparisons made (commonly with a Bonferroni adjustment).",
    hypotheses: {
      h0: "For each pair of groups: the two groups come from the same distribution.",
      h1: "For each pair: the two groups' distributions differ."
    },
    assumptions: [
      "Run only after a significant Kruskal-Wallis test",
      "Outcome is at least ordinal",
      "No normality assumption required"
    ],
    whenToUse: "Use immediately after a significant Kruskal-Wallis test to pin down which specific groups differ, especially when your data is skewed or ordinal and a parametric post-hoc test like Tukey's HSD would be inappropriate.",
    statisticIdea: "Like Tukey's HSD but performed on the rank sums from the Kruskal-Wallis test rather than raw means, with a multiple-comparison correction applied across all pairs tested.",
    mlExample: {
      scenario: "Your Kruskal-Wallis test found that inference latency differs significantly across three hardware configurations (latency is right-skewed, so Kruskal-Wallis was the right initial test). Now you need to know which configurations actually differ.",
      data: "Dunn's test (Bonferroni-corrected) on all 3 pairs: Config A vs C significant (p=0.003); A vs B and B vs C not significant.",
      conclusion: "Only configurations A and C differ meaningfully in latency — B is statistically indistinguishable from both, so the procurement decision can focus on the proven gap between A and C."
    },
    prosCons: {
      pros: ["Properly controls for multiple comparisons after Kruskal-Wallis, unlike running several separate Mann-Whitney tests", "Robust to skew and outliers, consistent with why Kruskal-Wallis was chosen in the first place"],
      cons: ["Slightly less intuitive to explain to stakeholders than a difference-in-means from Tukey's HSD", "Like all post-hoc tests, statistical power drops as more groups (and thus more pairwise comparisons) are added"]
    },
    related: "kruskal",
    relatedLabel: "Runs after: Kruskal-Wallis H Test"
  }
];

const FLOWCHART = {
  root: "start",
  nodes: {
    // ---------- ROOT ----------
    start: {
      label: "How many groups /\nsamples?",
      type: "question",
      branches: [
        { label: "One sample", to: "one_sample_type" },
        { label: "Two / more samples", to: "paired_dependent" }
      ]
    },

    // ============ ONE SAMPLE BRANCH ============
    one_sample_type: {
      label: "What type of data?",
      type: "question",
      branches: [
        { label: "Continuous", to: "one_sample_normal" },
        { label: "Categorical", to: "chisquare_onesample", testId: "chisquare" }
      ]
    },
    one_sample_normal: {
      label: "Normal distribution?",
      type: "question",
      branches: [
        { label: "Yes", to: "one_sample_sd_known" },
        { label: "No", to: "wilcoxon_one_sample", testId: "wilcoxon_one_sample" }
      ]
    },
    one_sample_sd_known: {
      label: "Population SD known?",
      type: "question",
      branches: [
        { label: "Yes", to: "ztest_one_sample", testId: "ztest_one_sample" },
        { label: "No", to: "ttest_one_sample", testId: "ttest_one_sample" }
      ]
    },

    // ============ TWO / MORE SAMPLES BRANCH ============
    paired_dependent: {
      label: "Are the samples paired /\ndependent?",
      type: "question",
      branches: [
        { label: "Yes", to: "paired_type" },
        { label: "No", to: "ind_group_count" }
      ]
    },

    // ---------- PAIRED branch ----------
    paired_type: {
      label: "What type of data?",
      type: "question",
      branches: [
        { label: "Continuous", to: "paired_normal" },
        { label: "Categorical", to: "mcnemar", testId: "mcnemar" }
      ]
    },
    paired_normal: {
      label: "Normal distribution?",
      type: "question",
      branches: [
        { label: "Yes", to: "ttest_paired", testId: "ttest_paired" },
        { label: "No", to: "paired_group_count" }
      ]
    },
    paired_group_count: {
      label: "Number of groups?",
      type: "question",
      branches: [
        { label: "Two", to: "wilcoxon", testId: "wilcoxon" },
        { label: "Three+", to: "friedman", testId: "friedman" }
      ]
    },

    // ---------- INDEPENDENT branch ----------
    ind_group_count: {
      label: "How many groups?",
      type: "question",
      branches: [
        { label: "Two", to: "ind_two_type" },
        { label: "Three or more", to: "ind_three_type" }
      ]
    },

    // -- independent, two groups --
    ind_two_type: {
      label: "What type of data?",
      type: "question",
      branches: [
        { label: "Categorical", to: "ind_two_cells" },
        { label: "Continuous", to: "ind_two_normal" }
      ]
    },
    ind_two_cells: {
      label: "Expected cell\ncounts ≥ 5?",
      type: "question",
      branches: [
        { label: "Yes", to: "chisquare_indtwo", testId: "chisquare" },
        { label: "No", to: "fisher", testId: "fisher" }
      ]
    },
    ind_two_normal: {
      label: "Normal distribution?",
      type: "question",
      branches: [
        { label: "Yes", to: "ind_two_sd_known" },
        { label: "No", to: "mannwhitney", testId: "mannwhitney" }
      ]
    },
    ind_two_sd_known: {
      label: "Population SD known?",
      type: "question",
      branches: [
        { label: "Yes", to: "ztest_two_sample", testId: "ztest_two_sample" },
        { label: "No", to: "ttest_ind", testId: "ttest_ind" }
      ]
    },

    // -- independent, three or more groups --
    ind_three_type: {
      label: "What type of data?",
      type: "question",
      branches: [
        { label: "Continuous", to: "ind_three_normal" },
        { label: "Categorical", to: "chisquare_indthree", testId: "chisquare" }
      ]
    },
    ind_three_normal: {
      label: "Normal distribution?",
      type: "question",
      branches: [
        { label: "Yes", to: "ind_three_variance" },
        { label: "No", to: "kruskal", testId: "kruskal" }
      ]
    },
    ind_three_variance: {
      label: "Equal variance?",
      type: "question",
      branches: [
        { label: "No", to: "welch_anova", testId: "welch_anova" },
        { label: "Yes", to: "ind_three_factors" }
      ]
    },
    ind_three_factors: {
      label: "How many factors?",
      type: "question",
      branches: [
        { label: "One", to: "anova", testId: "anova" },
        { label: "Two", to: "twoway_anova", testId: "twoway_anova" }
      ]
    },

    // -- post-hoc forks (drawn as a visual continuation, not a real decision the
    //    user makes mid-test — but kept clickable since they're real follow-up tests) --
    anova_posthoc: {
      label: "Post-hoc test\nselection",
      type: "question",
      branches: [
        { label: "All pairs", to: "tukey_hsd", testId: "tukey_hsd" },
        { label: "Vs. one control", to: "dunnett", testId: "dunnett" }
      ]
    },
    kruskal_posthoc: {
      label: "Significant result —\nneed pairwise comparison",
      type: "question",
      branches: [
        { label: "Pairwise", to: "dunn", testId: "dunn" }
      ]
    }
  },
  // Sequential edges drawn after a leaf test that itself leads into another
  // node (e.g. ANOVA significant -> post-hoc selection). Rendered the same
  // way as branches but kept separate so the leaf-test layer stays simple.
  postHoc: [
    { from: "anova", to: "anova_posthoc", label: "If significant" },
    { from: "kruskal", to: "kruskal_posthoc", label: "If significant" }
  ]
};

