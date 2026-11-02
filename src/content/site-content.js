/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONTENT: the only file you need to edit.
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything on the page (intro, org chart, team deck, profiles, projects)
 *  is generated from this file at build time.
 *
 *  • The intro copy and the projects are still PLACEHOLDER content. The people
 *    are real, but only names and job titles are filled in. Add a bio, skills,
 *    email and so on to anyone (see the template just below `leaders`).
 *  • Reporting lines come from nesting, so you never write "reports to":
 *      leaders            the top of the org (here: the Managing Director)
 *       └ subTeams        the organizations under a leader (here: one per Director)
 *          ├ manager      who runs it (the Director)
 *          └ members      the Director's direct reports
 *             └ reports   anyone's direct reports, nested as deep as you like
 *    A member who has `reports` gets their own step in "Meet the teams".
 *  • People get an id from their name ("Priya Raman" -> "priya-raman"). Use that
 *    id in a project's `people` list. If two people share a name, give one of them
 *    an `id: '...'` of their own.
 *  • Photos: put a square image in public/people/ and set photo: 'people/<file>.jpg'.
 *    Leave photo empty to show initials.
 *  • Organization colors: blue, red, purple, yellow, burgundy, green.
 *  • After editing, run `npm run check` for a plain-English error report, or just
 *    `npm run build` (the build stops with the same report if something is wrong).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** @type {import('../lib/model.js').SiteContent} */
export default {
  site: {
    teamName: 'Customer Insights & Analytics',
    shortName: 'CI&A',
    tagline: 'We turn customer signals into decisions.',
    description:
      'Customer Insights & Analytics turns surveys, behavior and experiments into insights the business can act on.',
    email: 'customer-insights@example.com',
    chat: '#customer-insights',
    location: 'Chicago · Houston · Remote',
  },

  hero: {
    eyebrow: 'Customer Insights & Analytics',
    // Each entry is one line of the giant headline.
    headline: ['Customer insights', '& analytics'],
    intro:
      'We listen to customers at scale. We blend survey feedback, behavioral data and experiments into insights that product, marketing and operations teams can act on.',
    // Phrases from the intro to highlight. They must appear in the intro exactly.
    highlights: ['listen to customers', 'act on'],
    ctas: [
      { label: 'Meet the team', href: '#team' },
      { label: 'See our work', href: '#work' },
    ],
  },

  mission: {
    eyebrow: 'Why we exist',
    statement:
      'Every day, customers tell us what they need through surveys, clicks, calls and comments. We turn that noise into a clear picture, and we make sure it reaches the people who can do something about it.',
  },

  whatWeDo: {
    eyebrow: 'What we do',
    title: 'Five ways we help',
    lede: 'From the first survey response to the model in production, we cover the full path from signal to decision.',
  },

  // `teams` can list team ids (an organization id, or the id of someone who leads a
  // team) to show a "Led by" chip. None are linked yet.
  pillars: [
    {
      title: 'Listen at scale',
      text: 'We run the surveys, feedback programs and text analytics that capture how customers feel, in their own words.',
    },
    {
      title: 'Map the journey',
      text: 'We connect touchpoints across channels to show where journeys break down, and where they delight.',
    },
    {
      title: 'Test before we bet',
      text: 'We design experiments and measurement plans so teams know what actually moved the needle.',
    },
    {
      title: "Predict what's next",
      text: 'We build models that anticipate needs, flag churn risk and choose the next best action for each customer.',
    },
    {
      title: 'Put insights in every hand',
      text: "We ship dashboards, data products and self-serve tools, so answers don't wait in a queue.",
    },
  ],

  // value: 'auto:people' | 'auto:teams' | 'auto:projects' | 'auto:subTeams' are counted for you.
  // placeholder: true adds an asterisk and a footnote until you replace the figure.
  stats: [
    { value: 'auto:people', label: 'People on the team' },
    { value: 'auto:teams', label: 'Teams' },
    { value: 'auto:projects', label: 'Projects featured here' },
    { value: 1200000, label: 'Survey responses analyzed a year', placeholder: true },
  ],

  team: {
    eyebrow: 'Meet the team',
    title: 'Who we are',
    lede: 'From the managing director to every analyst, here is who does the work. Select anyone to see their profile.',
  },

  people: {
    eyebrow: 'Up close',
    title: 'Meet the teams',
    lede: 'Scroll through leadership and each team to see who does what.',
  },

  leadership: {
    name: 'Leadership',
    mission: 'The managing director and the directors set the direction for Customer Analytics.',
  },

  /*
   * ── Org ───────────────────────────────────────────────────────────────────
   *  Titles are written out in full where the abbreviation was clear
   *  ("Sr Mgr" -> "Senior Manager"). A few were left as they came
   *  ("AO", "Op Dt Prd & Bus Int") because the long form wasn't certain.
   *
   *  CHECK THESE, they were read from the order of the original list, which had
   *  lost its indentation:
   *    • The three Directors report to Ben Phillips. Joe Bretthauer's and
   *      Stephanie Kuo's teams were split where the list changed Director.
   *    • Lana Alshahrour, Adane Yirdaw and Nora Loftus are under Almasa Krvavac.
   *    • Mudit Gattani, Peter Kim and Mike Nashtock lead the people listed under them.
   *    • Rikesh Shah's 22 people are listed as one flat team, including the two
   *      people titled Manager (Gaurav Vohra, Michael Rosenquest).
   *    • The two Kanika Guptas (an Intern and a Lead Analyst) are treated as
   *      different people. If they are one person, delete one entry.
   *
   *  To add details to someone, give them any of these (all optional):
   *    bio: 'One or two sentences.',
   *    skills: ['SQL', 'Python'],
   *    funFact: 'Something human.',
   *    email: 'name@example.com',
   *    chat: '@handle',
   *    location: 'Chicago',
   *    photo: 'people/first-last.jpg',
   *  To rename the team a person leads, add team: 'Digital Insights'.
   *  Otherwise it is called "<Name>'s team".
   */
  leaders: [
    {
      name: 'Ben Phillips',
      role: 'Managing Director, Customer Analytics',
      subTeams: [
        // ── Lauren Reuland's organization ────────────────────────────────────
        {
          id: 'reuland-org',
          name: 'Reuland org',
          color: 'blue',
          manager: { name: 'Lauren Reuland', role: 'Director, Customer Analytics' },
          members: [
            {
              name: 'Almasa Krvavac',
              role: 'Manager, Digital Insights',
              reports: [
                { name: 'Shayne Chammavanijakul', role: 'Senior Analyst, Digital Insights' },
                { name: 'Steven Luu', role: 'Senior Analyst, Digital Insights' },
                { name: 'Emma Jansen', role: 'Senior Analyst, Digital Insights' },
                { name: 'Lana Alshahrour', role: 'Analyst, Digital Insights' },
                { name: 'Adane Yirdaw', role: 'Senior Analyst, Digital Insights' },
                { name: 'Nora Loftus', role: 'Senior Analyst, Digital Insights' },
              ],
            },
            {
              name: 'Carleton Smith',
              role: 'Senior Manager, AO Data Insight & Analytics',
              reports: [
                {
                  name: 'Mudit Gattani',
                  role: 'Manager, Ops Planning & Analysis',
                  reports: [
                    { name: 'Akash Bhatt', role: 'Developer II, Op Dt Prd & Bus Int' },
                    { name: 'Neha', role: 'Analyst II, Data Analytics' },
                    { name: 'Kanika Gupta', role: 'Intern' },
                    { name: 'Abhijeet Singh', role: 'Senior Analyst, Customer I&A' },
                    { name: 'Sreelakshmi K M', role: 'Intern' },
                  ],
                },
              ],
            },
          ],
        },

        // ── Joe Bretthauer's organization ────────────────────────────────────
        {
          id: 'bretthauer-org',
          name: 'Bretthauer org',
          color: 'purple',
          manager: { name: 'Joe Bretthauer', role: 'Director, Customer Analytics' },
          members: [
            {
              name: 'Arjun Nayak U',
              role: 'Senior Manager, Customer I&A',
              reports: [
                {
                  name: 'Diksha Agrawal',
                  role: 'Manager, Customer I&A',
                  reports: [
                    { name: 'Ayushmaan Mahajan', role: 'Associate I, Data Scientist' },
                    { name: 'Manan Jindal', role: 'Analyst I, Customer I&A' },
                    { name: 'Disha Tiwari', role: 'Senior Analyst, Customer I&A' },
                    { name: 'Megha Chawla', role: 'Senior Analyst, Customer Analytics' },
                    { id: 'kanika-gupta-2', name: 'Kanika Gupta', role: 'Lead Analyst, Customer I&A' },
                  ],
                },
                {
                  name: 'Vikas Vijayananda',
                  role: 'Manager, Customer Analytics',
                  reports: [
                    { name: 'Manas', role: 'Analyst II, Customer I&A' },
                    { name: 'Ayush Sharma', role: 'Senior Analyst, Customer I&A' },
                    { name: 'Aditi Thakur', role: 'Intern' },
                    { name: 'Anchit Sood', role: 'Analyst, Data Analytics' },
                  ],
                },
              ],
            },
            {
              name: 'Rikesh Shah',
              role: 'Senior Manager, Optimization & Customer Innovation',
              reports: [
                { name: 'Aditya Shrivastava', role: 'Project Manager' },
                { name: 'Michael Stallter', role: "Qualtrics' EX Support" },
                { name: 'Punit Jakhetiya', role: 'Mobile App Architect' },
                { name: 'Nikhil Jain', role: 'Senior UI Developer' },
                { name: 'Sakshi Khurana', role: 'Associate Product Manager' },
                { name: 'Will Sammons', role: 'Senior Analyst, Digital Optimization' },
                { name: 'Yogesh Kumar', role: 'Digital Optimization' },
                { name: 'Himanshu Bapna', role: 'Senior Digital Optimization Engineer' },
                { name: 'Brittney Warner', role: 'Consultant' },
                { name: 'Roshan Patel', role: 'Senior Analyst, Digital Optimization' },
                { name: 'Gaurav Vohra', role: 'Technical Manager' },
                { name: 'Michael Rosenquest', role: 'Manager, Optimization & Customer Innovation' },
                { name: 'Natalie Freund', role: 'Senior Business Analyst, Digital Products' },
                { name: 'Muhammad Junaid', role: 'Senior UX Designer, Digital Products' },
                { name: 'Raja Pateriya', role: 'Digital Optimization' },
                { name: 'Niharika Bhargava', role: 'Senior Digital Optimization Engineer' },
                { name: 'Girish Gehlot', role: 'Developer' },
                { name: 'Shamitha Preethi Miriyala', role: 'Analyst, Digital Personalization V' },
                { name: 'Satish Vakkanti', role: 'Consulting' },
                { name: 'Shivani Verma', role: 'Senior Digital Optimization Engineer' },
                { name: 'Sonia Sharma', role: 'Digital Optimization' },
                { name: 'Sonal Pansari', role: 'Senior UI Developer' },
              ],
            },
            { name: 'Sanyam Jain', role: 'Data Scientist, Machine Learning' },
            {
              name: 'Vinod Punyani',
              role: 'Senior Manager, Customer Analytics',
              reports: [
                { name: 'Mary Kate Vowells', role: 'Associate Consultant' },
                { name: 'Ciera Young', role: 'Consumer Insights (CSpace)' },
                { name: 'Danielle Nalette', role: 'Associate Director' },
                { name: 'Brittany McCusker', role: 'Analyst' },
                { name: 'Michael Crema', role: 'Senior Researcher, Digital Products' },
                { name: 'Mary Mascari', role: 'Senior Researcher, Digital Products' },
              ],
            },
            {
              name: 'Joe Cozza',
              role: 'Senior Manager, Customer Analytics',
              reports: [
                { name: 'Musab Rashid', role: 'Senior Analyst, Digital Insights' },
                { name: 'Olga Niyibizi', role: 'Senior Analyst, Digital Optimization' },
                { name: 'Katie Lawton', role: 'Senior Analyst, Digital Insights' },
              ],
            },
          ],
        },

        // ── Stephanie Kuo's organization ─────────────────────────────────────
        {
          id: 'kuo-org',
          name: 'Kuo org',
          color: 'red',
          manager: { name: 'Stephanie Kuo', role: 'Director, Customer Analytics' },
          members: [
            {
              name: 'Claire Kaufman',
              role: 'Senior Manager, Customer Analytics',
              reports: [
                {
                  name: 'Peter Kim',
                  role: 'Manager, Customer I&A',
                  reports: [
                    { name: 'Maria Alvarez', role: 'Analyst, Customer Insights & Analytics' },
                    { name: 'Brittney Usoroh', role: 'Analyst, Customer Insights & Analytics' },
                  ],
                },
              ],
            },
            {
              name: 'Rajat Katiyar',
              role: 'Senior Manager, Customer I&A',
              email: 'rajat.katiyar@united.com',
              chat: '@temp',
              location: 'IKC, Gurugram',
              reports: [
                {
                  name: 'Nikita Aggarwal',
                  role: 'Manager, Customer I&A',
                  email: 'nikita.aggarwal@united.com',
                  location: 'IKC, Gurugram',
                  reports: [
                    { name: 'Aakriti Jain', role: 'Analyst I, Customer I&A' },
                    { name: 'Survagya Bali', role: 'Associate Analyst II, Customer I&A' },
                    { name: 'Amit Mahobe', role: 'Senior Analyst, Customer I&A' },
                    { name: 'Purva Arora', role: 'Associate Analyst II, Customer I&A' },
                  ],
                },
                {
                  name: 'Vaibhav Garg',
                  role: 'Manager, DS Machine Learning',
                  reports: [
                    { name: 'Chaitanya Bisht', role: 'Associate II, Data Scientist' },
                    { name: 'Ankit Aryan', role: 'Data Scientist, Machine Learning' },
                    { name: 'Vasu Mittal', role: 'Intern' },
                    { name: 'Kunjal Agarwal', role: 'Associate II, Data Scientist' },
                  ],
                },
                {
                  name: 'Sehr Mahajan',
                  role: 'Manager, Customer I&A',
                  reports: [
                    { name: 'Nandini Gupta', role: 'Intern' },
                    { name: 'Purti', role: 'Associate Analyst, Customer I&A' },
                    { name: 'Gunjan Agarwal', role: 'Analyst II, Customer I&A' },
                    { name: 'Rishi Raj', role: 'Senior Analyst, Customer I&A' },
                  ],
                },
              ],
            },
            { name: 'Megan Caruso', role: 'Manager, Customer I&A' },
            {
              name: 'Ryan Neuhaus',
              role: 'Senior Manager, Customer Analytics',
              reports: [
                {
                  name: 'Mike Nashtock',
                  role: 'Manager, Customer I&A',
                  reports: [
                    { name: 'Vince Tedrick', role: 'Senior Analyst, Customer I&A' },
                    { name: 'Justin Abraham', role: 'Senior Analyst, Customer I&A' },
                    { name: 'Tressie Collier', role: 'Senior Analyst, Customer I&A' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  work: {
    eyebrow: 'Selected work',
    title: 'Projects',
    lede: 'A few things we have shipped. Everything here is placeholder content for now.',
  },

  // art: 'sparkline' | 'wave' | 'bars' | 'dots' | 'funnel' | 'rings' (generated cover art)
  // link: optional URL; when set, the card gets an arrow and opens it.
  // subTeam: optional team id (an organization id, or the id of someone who leads a
  //   team, like 'carleton-smith'); it adds a colored chip. people: ids of people to credit.
  // These example projects are not linked to anyone yet.
  projects: [
    {
      title: 'Journey Lens',
      year: 2026,
      summary: 'An end-to-end view of customer journeys across web, app and contact center, built on one shared event model.',
      impact: { value: '40+', label: 'teams use it weekly' },
      methods: ['Path analysis', 'Event modeling', 'Dashboards'],
      art: 'sparkline',
      link: '',
    },
    {
      title: 'Pulse',
      year: 2026,
      summary: 'Real-time feedback monitoring that groups comments into themes and alerts owners when sentiment shifts.',
      impact: { value: '2 hrs', label: 'from comment to owner' },
      methods: ['NLP', 'Topic modeling', 'Alerting'],
      art: 'wave',
      link: '',
    },
    {
      title: 'Test & Learn Hub',
      year: 2025,
      summary: 'Self-serve experimentation: sample sizing, guardrail metrics and readouts in one place.',
      impact: { value: '3×', label: 'more tests per quarter' },
      methods: ['A/B testing', 'Power analysis', 'Readouts'],
      art: 'funnel',
      link: '',
    },
    {
      title: 'Churn Radar',
      year: 2025,
      summary: 'An early-warning model that flags customers at risk of leaving, with reasons account teams can act on.',
      impact: { value: '18%', label: 'fewer at-risk customers lost' },
      methods: ['Survival models', 'Explainability', 'MLOps'],
      art: 'rings',
      link: '',
    },
    {
      title: 'Segment Studio',
      year: 2025,
      summary: 'A shared library of customer segments with clear definitions, so every team targets the same people the same way.',
      impact: { value: '120', label: 'segments in the library' },
      methods: ['Clustering', 'Personas', 'Governance'],
      art: 'dots',
      link: '',
    },
    {
      title: 'Insight Hub',
      year: 2024,
      summary: 'One front door for dashboards, metric definitions and data requests, with usage tracking built in.',
      impact: { value: '5k', label: 'monthly visitors' },
      methods: ['Product analytics', 'BI', 'Data catalog'],
      art: 'bars',
      link: '',
    },
    {
      title: 'Comment Miner',
      year: 2024,
      summary: 'A GenAI assistant that summarizes thousands of comments into a one-page brief with representative quotes.',
      impact: { value: '90%', label: 'less time spent reading comments' },
      methods: ['LLMs', 'Summarization', 'Evaluation'],
      art: 'dots',
      link: '',
    },
    {
      title: 'Next Best Action',
      year: 2024,
      summary: 'Personalized recommendations that pick the most helpful message for each customer at each moment.',
      impact: { value: '+11%', label: 'engagement with messages' },
      methods: ['Uplift modeling', 'Recommenders', 'Experimentation'],
      art: 'sparkline',
      link: '',
    },
  ],

  footer: {
    eyebrow: 'Get in touch',
    headline: ["Let's find", 'the answer'],
    text: 'Have a question about your customers? Bring it to us. We would rather start with a good question than a perfect dataset.',
    notice: 'Prototype with placeholder content.',
  },
};
