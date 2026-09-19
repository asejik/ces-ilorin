export interface QuestionDefinition {
  questionText: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  marks: number;
}

export interface CourseDefinition {
  code: string;
  title: string;
  type: 'quiz' | 'final_exam';
  maxScore: number;
  defaultPin: string;
  description: string;
  questions: QuestionDefinition[];
}

export const CES_CURRICULUM: CourseDefinition[] = [
  {
    code: 'salvation',
    title: 'Doctrine of Salvation',
    type: 'quiz',
    maxScore: 5.0,
    defaultPin: 'SALV26',
    description: 'The foundation of the Christian faith, new birth, and redemption in Christ.',
    questions: [
      {
        questionText: 'According to Romans 10:9-10, what two actions are necessary for salvation?',
        options: [
          'Confessing sins and paying tithes',
          'Confessing with the mouth and believing in the heart',
          'Water baptism and fasting for 3 days',
          'Church membership and good moral conduct',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'What is the primary gift given to a believer at the new birth?',
        options: [
          'Worldly wealth',
          'Eternal life (Zoe)',
          'Physical invulnerability',
          'Immediate theological mastery',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'According to Ephesians 2:8-9, salvation is received through:',
        options: [
          'Personal good works',
          'Ancestral heritage',
          'Grace through faith',
          'Rigorous spiritual discipline',
        ],
        correctOptionIndex: 2,
        marks: 1.0,
      },
      {
        questionText: 'In 2 Corinthians 5:17, what does it mean to be a "new creation"?',
        options: [
          'Reforming one’s bad habits',
          'The spirit man is made entirely new in Christ',
          'Changing physical appearance',
          'Joining a new religious denomination',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'Jesus Christ accomplished our redemption primarily through:',
        options: [
          'His moral philosophies',
          'His shed blood on the cross and bodily resurrection',
          'His political influence in Judea',
          'The construction of the temple',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
    ],
  },
  {
    code: 'righteousness',
    title: 'Righteousness of God',
    type: 'quiz',
    maxScore: 5.0,
    defaultPin: 'RGHT26',
    description: 'Understanding our right standing with God without guilt, fear, or condemnation.',
    questions: [
      {
        questionText: 'What is Biblical righteousness primarily defined as?',
        options: [
          'A feeling of moral superiority',
          'Right standing with God without guilt, fear, or condemnation',
          'Flawless legal obedience to the Mosaic law',
          'Public displays of religious fasting',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'According to Romans 5:17, righteousness is received as:',
        options: [
          'A reward for long fasting',
          'A free gift through Jesus Christ',
          'A certificate from the church council',
          'An inheritance from pious parents',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'According to 2 Corinthians 5:21, who became sin for us that we might become the righteousness of God?',
        options: [
          'The Apostles',
          'John the Baptist',
          'Jesus Christ',
          'Moses',
        ],
        correctOptionIndex: 2,
        marks: 1.0,
      },
      {
        questionText: 'What does righteousness give the believer boldness to do?',
        options: [
          'Approach the throne of grace with confidence',
          'Condemn and judge unbelievers',
          'Ignore all church authority',
          'Boast in human achievements',
        ],
        correctOptionIndex: 0,
        marks: 1.0,
      },
      {
        questionText: 'Righteousness consciousness replaces which destructive mindset?',
        options: [
          'Prosperity mindset',
          'Sin consciousness and condemnation',
          'Joy and peace',
          'Humility',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
    ],
  },
  {
    code: 'word_of_god',
    title: 'Integrity of the Word of God',
    type: 'quiz',
    maxScore: 5.0,
    defaultPin: 'WORD26',
    description: 'The supreme authority, inspiration, and transforming power of the Scriptures.',
    questions: [
      {
        questionText: 'According to 2 Timothy 3:16, all Scripture is:',
        options: [
          'Written only by human imagination',
          'Inspired by God (God-breathed)',
          'Outdated historical literature',
          'Applicable only to the Old Testament Jews',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'According to Hebrews 4:12, the Word of God is described as:',
        options: [
          'Dead and inactive',
          'Alive and active, sharper than any two-edged sword',
          'A complex mystery meant only for priests',
          'Temporary guidance for ancient times',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'How does faith come according to Romans 10:17?',
        options: [
          'By wishing and hoping',
          'By hearing the Word of God',
          'By observing natural miracles',
          'By philosophical reasoning',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'In Matthew 4:4, Jesus answered the tempter saying man shall not live by bread alone, but by:',
        options: [
          'Every decree of earthly rulers',
          'Human wisdom and secular philosophy',
          'Every word that proceeds from the mouth of God',
          'Financial security',
        ],
        correctOptionIndex: 2,
        marks: 1.0,
      },
      {
        questionText: 'Meditating on the Word of God day and night brings what result according to Joshua 1:8?',
        options: [
          'Spiritual arrogance',
          'Physical exhaustion',
          'Prosperous way and good success',
          'Isolation from church community',
        ],
        correctOptionIndex: 2,
        marks: 1.0,
      },
    ],
  },
  {
    code: 'love_walk',
    title: 'The Love Walk & Christian Character',
    type: 'quiz',
    maxScore: 5.0,
    defaultPin: 'LOVE26',
    description: 'Walking in divine Agape love as the hallmark of true Christian maturity.',
    questions: [
      {
        questionText: 'What kind of love is shed abroad in our hearts by the Holy Spirit (Romans 5:5)?',
        options: [
          'Phileo (brotherly affection)',
          'Eros (romantic affection)',
          'Agape (unconditional God-kind of love)',
          'Storge (family affection)',
        ],
        correctOptionIndex: 2,
        marks: 1.0,
      },
      {
        questionText: 'According to 1 Corinthians 13:4-7, love is characterized by:',
        options: [
          'Envy and boasting',
          'Patience, kindness, and not seeking its own',
          'Quick temper and resentment',
          'Pride and arrogance',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'How will all people know that we are Jesus’ disciples (John 13:35)?',
        options: [
          'If we perform dramatic miracles',
          'If we have love for one another',
          'If we wear special religious garments',
          'If we speak with eloquence',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'Walking in love requires forgiving others as God in Christ forgave us. This is found in:',
        options: [
          'Ephesians 4:32',
          'Genesis 1:1',
          'Leviticus 11:4',
          'Proverbs 26:11',
        ],
        correctOptionIndex: 0,
        marks: 1.0,
      },
      {
        questionText: 'According to 1 John 4:18, what does perfect love do to fear?',
        options: [
          'Increases fear',
          'Drives out fear',
          'Justifies fear',
          'Ignores fear',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
    ],
  },
  {
    code: 'service',
    title: 'Ministry of Service & Church Stewardship',
    type: 'quiz',
    maxScore: 5.0,
    defaultPin: 'SERV26',
    description: 'Servant leadership, faithfulness in stewardship, and honoring God with our gifts.',
    questions: [
      {
        questionText: 'According to Mark 10:45, Jesus came not to be served, but to:',
        options: [
          'Be crowned king immediately',
          'Serve and give His life as a ransom for many',
          'Accumulate political followers',
          'Critique Roman government',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'In Colossians 3:23-24, whatever we do in service should be done:',
        options: [
          'Begrudgingly to impress the leadership',
          'Heartily, as to the Lord and not unto men',
          'Only when publicly recognized',
          'With minimum required effort',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'Faithfulness in service is tested first in:',
        options: [
          'Great international platforms',
          'Little things and another man’s work (Luke 16:10-12)',
          'Public leadership roles',
          'Social media popularity',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'What attitude should accompany Christian service according to Romans 12:11?',
        options: [
          'Slothfulness and procrastination',
          'Fervent in spirit, serving the Lord',
          'Complaining and disputing',
          'Seeking financial payback',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'Every believer has received spiritual gifts for what primary purpose (1 Peter 4:10)?',
        options: [
          'Personal entertainment',
          'Ministering to one another as good stewards',
          'Exalting self over others',
          'Commercial profit',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
    ],
  },
  {
    code: 'spiritual_authority',
    title: 'Spiritual Authority & Believer’s Rights',
    type: 'quiz',
    maxScore: 5.0,
    defaultPin: 'AUTH26',
    description: 'Exercising the authority of the believer in the Name of Jesus Christ.',
    questions: [
      {
        questionText: 'Where is the believer seated with Christ according to Ephesians 2:6?',
        options: [
          'In purgatory',
          'In earthly spiritual bondage',
          'In heavenly places in Christ Jesus',
          'At the judgment hall of Pilate',
        ],
        correctOptionIndex: 2,
        marks: 1.0,
      },
      {
        questionText: 'According to Luke 10:19, what authority did Jesus give His disciples?',
        options: [
          'Authority over physical governments',
          'Authority to trample on serpents and scorpions, and over all the power of the enemy',
          'Authority to avoid all human duties',
          'Authority to condemn the world',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'What is the primary instrument of the believer’s authority on earth?',
        options: [
          'The Name of Jesus Christ',
          'A wooden cross or physical talisman',
          'Special blessed holy water',
          'Ceremonial incense',
        ],
        correctOptionIndex: 0,
        marks: 1.0,
      },
      {
        questionText: 'According to James 4:7, how do we make the devil flee?',
        options: [
          'Begging him to leave',
          'Submitting to God and resisting the devil',
          'Negotiating terms with evil spirits',
          'Running away in fear',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'According to Matthew 18:18, whatever the church binds on earth shall be:',
        options: [
          'Ignored in heaven',
          'Bound in heaven',
          'Debated by angels',
          'Temporarily postponed',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
    ],
  },
  {
    code: 'holy_spirit',
    title: 'Person and Power of the Holy Spirit',
    type: 'quiz',
    maxScore: 5.0,
    defaultPin: 'SPIR26',
    description: 'The ministry of the Holy Spirit, spiritual baptism, gifts, and guidance.',
    questions: [
      {
        questionText: 'Who is the Holy Spirit according to Scripture?',
        options: [
          'An impersonal cosmic force or energy',
          'The third Person of the Godhead, with mind, will, and emotions',
          'An angel sent from heaven',
          'A human state of deep enlightenment',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'According to Acts 1:8, what does the believer receive when the Holy Spirit comes upon them?',
        options: [
          'Political authority',
          'Power (Dunamis) to be witnesses for Christ',
          'Exemption from all hardship',
          'Immunity from physical death',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'What initial physical evidence accompanied the baptism in the Holy Spirit in Acts 2:4?',
        options: [
          'Laughter',
          'Speaking with other tongues as the Spirit gave utterance',
          'Falling asleep',
          'Seeing lightning bolts',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'In John 14:16, Jesus promised the Father would send another Comforter (Parakletos), which means:',
        options: [
          'One called alongside to help, counsel, and strengthen',
          'A distant judge',
          'A harsh taskmaster',
          'A temporary advisor',
        ],
        correctOptionIndex: 0,
        marks: 1.0,
      },
      {
        questionText: 'According to 1 Corinthians 14:4, he who speaks in an unknown tongue:',
        options: [
          'Confuses the church',
          'Edifies (builds up) himself',
          'Wastes precious time',
          'Sinfully shows off',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
    ],
  },
  {
    code: 'prayer',
    title: 'Prevailing Prayer & Intercession',
    type: 'quiz',
    maxScore: 5.0,
    defaultPin: 'PRAY26',
    description: 'Principles of New Testament prayer, faith-filled petition, and intercession.',
    questions: [
      {
        questionText: 'To whom does Jesus teach believers to pray in the New Testament (John 16:23)?',
        options: [
          'To departed saints',
          'To the Father in the Name of Jesus',
          'To the angels of God',
          'To religious icons',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'According to Mark 11:24, when should a believer believe they have received what they pray for?',
        options: [
          'When they physically touch it',
          'When they pray',
          'After several months of sorrow',
          'Only if the pastor confirms it',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'According to 1 John 5:14-15, our confidence in prayer is based on:',
        options: [
          'Praying according to His will (His Word)',
          'The volume of our shouting',
          'The length of our prayer session',
          'Our personal righteous deeds',
        ],
        correctOptionIndex: 0,
        marks: 1.0,
      },
      {
        questionText: 'In 1 Thessalonians 5:17, believers are instructed to:',
        options: [
          'Pray only on Sundays',
          'Pray without ceasing',
          'Pray only when in severe distress',
          'Recite memorized chants',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
      {
        questionText: 'According to James 5:16, the effectual fervent prayer of a righteous man:',
        options: [
          'Has very little impact',
          'Avails much / produces tremendous power',
          'Is only heard if done in church',
          'Requires monetary sacrifice',
        ],
        correctOptionIndex: 1,
        marks: 1.0,
      },
    ],
  },
  {
    code: 'final_exam',
    title: 'CES Comprehensive Final Examination',
    type: 'final_exam',
    maxScore: 60.0,
    defaultPin: 'EXAM26',
    description: 'The culminating evaluation across all 8 modules of Christian discipleship.',
    questions: [
      {
        questionText: 'Comprehensive Doctrine: What constitutes the total foundation of the Christian discipleship journey in CES?',
        options: [
          'Occasional church attendance without study',
          'New birth in Christ, renewal of the mind through God’s Word, and active ministry of service',
          'Adhering strictly to ancestral traditions',
          'Memorizing religious philosophy without personal faith',
        ],
        correctOptionIndex: 1,
        marks: 12.0,
      },
      {
        questionText: 'Righteousness & Identity: Explain how righteousness impacts a believer’s daily communion with God.',
        options: [
          'It causes feelings of shame and unworthiness',
          'It provides bold access to God’s throne without guilt, condemnation, or inferiority',
          'It requires constant animal sacrifices',
          'It makes prayer unnecessary',
        ],
        correctOptionIndex: 1,
        marks: 12.0,
      },
      {
        questionText: 'Spiritual Authority: What is the primary basis of a believer’s authority over spiritual darkness?',
        options: [
          'Human physical strength and intellect',
          'The triumph of Jesus Christ in His death, burial, resurrection, and seating at the Father’s right hand',
          'Charms and sacred physical artifacts',
          'Denominational tradition',
        ],
        correctOptionIndex: 1,
        marks: 12.0,
      },
      {
        questionText: 'Holy Spirit & Power: Describe the role of the Holy Spirit in personal discipleship and soul winning.',
        options: [
          'The Holy Spirit convicts, guides into all truth, empowers as a witness, and distributes spiritual gifts',
          'The Holy Spirit is merely a historical symbol',
          'The Holy Spirit replaces personal study of the Bible',
          'The Holy Spirit operates exclusively through ordained bishops',
        ],
        correctOptionIndex: 0,
        marks: 12.0,
      },
      {
        questionText: 'Stewardship & Church Service: How does a disciple demonstrate commitment to the local assembly (Citizens of Light Church)?',
        options: [
          'Attending only when convenient',
          'Faithfully serving in a department, loving the brethren, submitting to leadership, and supporting the kingdom vision',
          'Criticizing leadership publicly',
          'Demanding financial honoraria for voluntary church tasks',
        ],
        correctOptionIndex: 1,
        marks: 12.0,
      },
    ],
  },
];
