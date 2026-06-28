import type { MarketBrief } from "@/types/brief";

/**
 * Real `POST /research` response captured from the backend pipeline for the idea
 * below — stored so every screen renders real content (Habitica, Habitify, the
 * no-streaks angle). Shape matches `src/types/brief.ts` exactly; to refresh,
 * paste a newer `/research` JSON here.
 *
 * NOTE: `scout.web_results` and `scout.app_reviews` are raw scraped text that no
 * screen renders. They're stored as a faithful representative sample (not the
 * full ~80-entry dumps) to keep this file readable; `source_count` is the real
 * pipeline total (107). Everything the UI renders — analyst, strategist,
 * opportunity score, competitor/app names, HN & PH posts — is verbatim.
 */
export const mockBrief: MarketBrief = {
  idea: "a habit tracker for ADHD adults",
  scout: {
    web_results: [
      "Can I ask why you went with TickTick over alternatives like Todoist and atoms over other apps like habitica (or Todoist with habit tracker)?",
      "Helpful tech tools for ADHD: • Task management apps like Trello, Notion, or Todoist. • Pomodoro timers to structure focus time. • Habit trackers",
      "I used Habitica to build daily routines, track good and bad habits, and make a list of tasks I used to put off forever. Instead of nagging",
      "Online ADHD tools for adults. # 6 Online ADHD Management Tools for Adults. When attention-deficit/hyperactivity disorder (ADHD) makes it difficult to manage time, overcome procrastination, and finish daily tasks, your first instinct might be to blame yourself. While they don’t cure ADHD, these tools can help tip the scale in your favor. You’ll then both work on your own tasks while keeping your cameras on so you can see what the other person is doing. Here are some of the features of Focusmate. While body doubling is a great technique, it isn’t the only strategy to boost your focus, management, and organization. The Focus Keeper is a Pomodoro Timer that can help you concentrate on your task, maintain motivation, and prevent mental fatigue or distraction.",
      "# Best ADHD Planner and Productivity App. Lunatask is an all-in-one encrypted to-do list, habit tracker, journaling, life-tracking and notes app. It effortlessly manages tasks for you and keeps track of your mental well-being 🌟. ## What is ADHD? It is estimated that 5% of the world population lives with ADHD. Usually, people are born with this disorder and, unlike believed in the past, if you have it you will have it for the rest of your life.",
      "Gamifying seems to work well for me as an ADHD hack by creating a challenge with visual progress milestones while holding me accountable to",
      "... habits and reduce overwhelm for adults with ADHD. Solanto, M. V. (2011). Cognitive-Behavioral Therapy for Adult ADHD: Targeting Executive",
    ],
    app_reviews: [
      "This habit tracker is user friendly for me AND my tween daughter! It is very simple to setup/customize/edit habits! We love the sound effects & progress bars to keep us on track with that extra hit of dopamine, too! We really appreciate the skip feature, so our streaks across the weeks and months are not totally reset. This app functions smoothly and has been an excellent tool to accomplish so many goals!",
      "I was using other apps but I think this one is best for my adhd, it's simple and easy to use and not overwhelming. only thing is it offered me discount for lifetime purchase, but when I wanted to buy it (today) that offer was gone. otherwise I'm completely satisfied let's see how this one works.",
      "This app requires me to restore the purchase constantly even though u purchased a lifetime subscription. It’s annoying that I have to jump through hoops to use something I’ve already purchased.",
      "I have ADHD so it can be hard for me to focus on tasks off screen, with this app, not only does it look cute but it also helps me restrict the amount of time I spend Online, so I can focus on other tasks like reading, drawing and sewing! Thank you for creating this app.",
      "I love it, honestly. I have severe ADHD and focus has always difficult— specially entering the workforce as an adult. This app was really fun for me! However after a certain point the study time-to-sock ratio plummeted.",
      "I am so so grateful for this app. It’s the best I’ve ever used for this purpose. I have raging ADHD and insomnia, this is what helps me fully put my phone down without the anxious need to check it.",
      "Trello is a joke for business. Should only be used for extremely simple things.",
      "Please bring back the icons when making habits instead of emojis, it looks so much nicer to have as a widget.",
      "I’ve tried so many apps with to-do lists and other focus related tools, but they all fell flat against my adhd. Having my cute lil bean to help me, and decorating a cozy home as a reward is so full-filling.",
      "No different then the reminders app that’s already included for free on your iPhone. I set reminders on this app to remind me to do things and it never sent notifications.",
    ],
    play_reviews: [],
    hn_posts: [
      "Show HN: DopaLoop – Habit tracker for ADHD brains, local-first, no streaks",
      "Habitualy – A Habit Tracker for Visual ADHD Brains",
      "My users say they'd cry if my app disappeared. None of them pay",
      'Built this solo as a side project alongside day job. No external funding, 100% bootstrapped. $45k cash reserves gives me runway, but 3 years with these metrics has me questioning if there\'s a path forward. Tech stack: Kotlin Multiplatform, Compose Multiplatform, targeting Android/iOS/WearOS. 99% crash-free rate, 4.2* rating. The app works - users just don\'t stick or pay. The regularity pattern (CV) analysis was eye-opening: active power users have CV <0.5 (consistent daily routine), churned power users have CV >0.7 (boom-bust). But when I analyzed paying customers, only 15% match this pattern. Most revenue comes from people who try it briefly and churn within 1-2 billing cycles.',
      'I don\'t know, but could it be that your "pro" features aren\'t anything special? I mean, if a power user can be on the app for so long, and never actually need to use those features, why would they pay for it?',
      "Congrats on building this and thanks for sharing. I'm working through a similar problem. One thing I'd want to know is how you're distributing the app - you're clearly able to get users. For example, what's the age band of user? What work do they do? Where are they located? What exactly are they using it for? In other words, I'm an advocate of niching down.",
      "Show HN: AI watched my screen for a year. Weather beat sleep",
      'It\'s really a great project, however I feel that most people are actually not that "ready" to get judged objectively about their own behavior, most people shield themselves from it.',
      "Show HN: A Habit Tracker designed to make you addicted to being consistent",
      'I\'d add a "sign in with Google" to this. The thought of creating an account for this is a barrier for me.',
      "I really like the clean user interface. It is simple, but still very attractive.",
      "I wish there were a way to reorder the habits and search habits. rather than have them all expanded on screen.",
    ],
    producthunt_posts: [
      "Fundraisly — AI fundraising agent that finds investors and books meetings\nFundraisly: ultimate AI agent for fundraising. It analyzes 300K+ investors and millions of deals, identifies the relevant ones actively investing in your space, maps warm paths to them from your own network, then covers the rest with targeted cold outreach. The result: 20-40 qualified investor meetings. Built by founders who raised over $1B.\n(1459 upvotes)",
      "Brew — Like Claude design for email marketing\nBrew is the fastest way to design and send beautiful, on-brand emails and automations that render perfectly in every inbox. Describe a campaign or a multi-step automation in plain English, and Brew builds the whole thing in seconds: copy, design, audience, and logic.\n(971 upvotes)",
      "Upstream — The inbox designed for humans and agents\nFinally, an inbox you'll look forward to. Agents sort your messages, draft your replies, and clear the grunt work behind the scenes, all in a client so well-crafted that email feels light, fast, fun.\n(881 upvotes)",
      "Goldfish — Press Option. It knows your work and replies like you\nMost AI tools make you explain the context before they can help. Goldfish already has it. It privately remembers what you’ve been working on across your Mac, then helps you write better from any app.\n(880 upvotes)",
      "Bond — The AI to-do list that does itself\nBond is an AI Chief of Staff for executives. It connects to your tools, learns how your company works, and turns scattered tasks into a self-managing to-do list that always knows what you need to do next.\n(759 upvotes)",
    ],
    competitor_names: [
      "Trello: Daily Task Tracker",
      "Habit Tracker",
      "Sup - Better Habits",
      "Focus Friend, by Hank Green",
      "I've tried 50+ productivity apps, and these are the ones that I really ...",
      "What are good ADHD habit tracking apps? - Facebook",
      "8 Habit Tracking Apps That Actually Work - YouTube",
      "Best Productivity Apps for Adults with ADHD | by Jordan Carter",
      "6 Online ADHD Management Tools for Adults",
      "Fundraisly",
      "Brew",
      "Upstream",
      "Goldfish",
      "Bond",
    ],
    scraped_app_names: [
      "Trello: Daily Task Tracker",
      "Habit Tracker",
      "Sup - Better Habits",
      "Focus Friend, by Hank Green",
    ],
    source_count: 107,
  },
  analyst: {
    pain_points: [
      {
        description:
          "Streak-based habit tracking systems are a poor fit for ADHD users because ADHD brains naturally have inconsistent days, and breaking a streak is discouraging.",
        severity: "high",
        evidence:
          "Streak-based habit trackers are the single worst design choice for ADHD users. ADHD brains have inherently inconsistent days. A streak system...",
      },
      {
        description:
          "The app is perceived as a generic habit tracker with no real ADHD-specific functionality.",
        severity: "high",
        evidence: "glorified habit tracker, nothing to do with adhd.",
      },
      {
        description:
          "Users are forced through a long onboarding (questions, sign-up) only to hit a paywall, with no free version available.",
        severity: "high",
        evidence:
          "Spent 10 minutes answering questions and signing my life away for it to ask me to sign up for a subscription... No free version",
      },
      {
        description:
          "The app fails to explain the methods or approach it uses to address ADHD, offering no tutorial or explanation.",
        severity: "medium",
        evidence:
          "Doesn’t even tell you methods of fixing your adhd it uses. No free version, tutorial video, explanation.",
      },
    ],
    competitors: [
      {
        name: "Habitify",
        strengths: [
          "Highly responsive customer support that fixes issues very quickly",
          "Reviewer's favorite after trying many habit tracking apps",
        ],
        weaknesses: [],
        positioning:
          "A fast, well-supported habit tracker positioned as a reliable favorite among people who have tried many alternatives.",
      },
      {
        name: "Habitica",
        strengths: [
          "Gamification makes self-improvement fun and rewarding",
          "Strong at motivating users to stick to goals",
          "Helps build discipline and consistency with daily habits",
          "Effective for people who struggle with procrastination or want to be more organized",
        ],
        weaknesses: [],
        positioning:
          "A gamified habit tracker that turns tasks into a game to motivate self-improvement.",
      },
    ],
    market_summary:
      "Market Landscape: Habit Tracker for ADHD Adults\n\nThe research excerpts reveal an active but contested market for ADHD-focused habit trackers aimed at adults, with several named products and notable design debates.\n\nExisting Products / Competitors:\n- \"ADHD Habit Tracker for Adults\" — positioned to help users build simple routines, stay organized, and improve focus without feeling overwhelmed, and to reduce overwhelm for adults with ADHD.\n- \"Habitualy\" — a habit tracker positioned for \"Visual ADHD Brains.\"\n- \"DopaLoop\" — a habit tracker for \"ADHD brains,\" differentiated as local-first and explicitly \"no streaks\" (launched via a Show HN post).\n\nKey Design Debate — Streaks:\nA central, contested design issue is the use of streak-based mechanics. One excerpt argues that \"streak-based habit trackers are the single worst design choice for ADHD users,\" reasoning that ADHD brains have inherently inconsistent days, which a streak system penalizes. This anti-streak sentiment is reflected in the market, with at least one product (DopaLoop) marketing itself explicitly as \"no streaks.\"\n\nDifferentiation Themes:\nProducts in this space differentiate around ADHD-specific needs, including reducing overwhelm, visual orientation (\"Visual ADHD Brains\"), and privacy/architecture (local-first).\n\nSkepticism / Credibility Risk:\nThere is skepticism about authenticity of ADHD positioning. One critical excerpt dismisses a product as a \"glorified habit tracker, nothing to do with adhd,\" indicating that buyers/users may scrutinize whether a tool offers genuine ADHD-specific value versus generic habit-tracking rebranded for the ADHD audience.\n\nClinical Grounding:\nAt least one product references clinical/academic grounding, citing Solanto, M. V. (2011), \"Cognitive-Behavioral Therapy for Adult ADHD: Targeting Executive [function],\" suggesting an opportunity to anchor product design in evidence-based approaches for executive function support.",
  },
  strategist: {
    opportunity_score: {
      market_crowding: "medium",
      user_pain_intensity: "high",
      differentiation_potential: "high",
      execution_complexity: "medium",
      overall: "high",
    },
    market_gaps: [
      {
        description:
          "An ADHD habit tracker that explicitly abandons streak mechanics in favor of forgiveness-oriented progress (e.g. 'most days', flexible recovery, no penalty for inconsistent days).",
        rationale:
          "The research's single highest-intensity pain point and most contested design debate is that streak systems are 'the single worst design choice for ADHD users' because ADHD brains have inconsistent days. Only one named competitor (DopaLoop) markets 'no streaks', while mainstream incumbents (Habitica, Habitify) lean on streaks/gamification — leaving room to own this positioning more credibly.",
      },
      {
        description:
          "A genuinely ADHD-specific tool grounded in executive-function science, not a generic tracker rebranded for ADHD.",
        rationale:
          "A pain point flags products dismissed as a 'glorified habit tracker, nothing to do with adhd', signaling buyer skepticism about authenticity. One product already cites Solanto (2011) CBT for Adult ADHD, showing buyers reward visible clinical grounding. A tool that builds features directly around executive-function deficits (initiation, working memory, time blindness) can defend against the 'rebranded generic app' critique.",
      },
      {
        description:
          "Transparent onboarding with a usable free tier and an upfront explanation of the method before any paywall.",
        rationale:
          "Users explicitly complain about spending 10 minutes answering questions and signing up only to hit a paywall 'with no free version', and that apps fail to explain the methods they use. A frictionless, free-to-try, method-transparent onboarding directly counters two documented high/medium pain points.",
      },
      {
        description: "A privacy-first / local-first ADHD tracker.",
        rationale:
          "DopaLoop differentiates on local-first architecture, indicating a privacy-conscious segment exists in this market. This remains thinly served and pairs well with the no-streaks and clinical-grounding angles as a trust signal.",
      },
    ],
    recommended_angle:
      "Position as the evidence-based, no-streaks ADHD habit tracker built around executive-function support — where 'inconsistent days are expected, not punished' — and prove the ADHD-specific value upfront with a free tier and a clear explanation of the CBT/executive-function method before any paywall.",
    risks: [
      "The no-streaks angle is already claimed by DopaLoop, so a new entrant risks being a me-too unless it goes deeper on executive-function mechanics rather than just dropping streaks.",
      "Buyers are skeptical of authentic ADHD positioning ('nothing to do with adhd'); without genuine, demonstrable ADHD-specific features the product will be dismissed as a rebranded generic tracker.",
      "Incumbents like Habitify (strong support, loyal users) and Habitica (proven gamification/motivation) are well-liked and could add ADHD-oriented modes, eroding differentiation.",
      "Clinical grounding (e.g. citing Solanto 2011) raises expectations and can invite scrutiny or regulatory/efficacy concerns if the product overclaims therapeutic benefit.",
      "Offering a free tier and transparent onboarding to counter paywall complaints may pressure monetization and unit economics.",
      "The research is drawn from limited excerpts; actual market size, willingness to pay, and breadth of competition for ADHD adults specifically are not fully established.",
    ],
  },
  generated_at: "2026-06-26T06:09:20.161050Z",
  duration_seconds: 49.76,
};
