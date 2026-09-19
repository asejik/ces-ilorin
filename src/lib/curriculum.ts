/**
 * Public course catalogue (titles, types, max scores).
 *
 * Question text, options, answer keys and session PINs are NEVER stored in
 * source control. They live only in the database (ces_quiz_questions /
 * ces_quizzes) and are managed there. Keep any local copy under private/.
 */
export interface CourseDefinition {
  code: string;
  title: string;
  type: 'quiz' | 'final_exam';
  maxScore: number;
  description: string;
}

export const CES_CURRICULUM: CourseDefinition[] = [
  {
    code: 'salvation',
    title: 'Doctrine of Salvation',
    type: 'quiz',
    maxScore: 5.0,
    description: 'The foundation of the Christian faith, new birth, and redemption in Christ.',
  },
  {
    code: 'righteousness',
    title: 'Righteousness of God',
    type: 'quiz',
    maxScore: 5.0,
    description: 'Understanding our right standing with God without guilt, fear, or condemnation.',
  },
  {
    code: 'word_of_god',
    title: 'Integrity of the Word of God',
    type: 'quiz',
    maxScore: 5.0,
    description: 'The supreme authority, inspiration, and transforming power of the Scriptures.',
  },
  {
    code: 'love_walk',
    title: 'The Love Walk & Christian Character',
    type: 'quiz',
    maxScore: 5.0,
    description: 'Walking in divine Agape love as the hallmark of true Christian maturity.',
  },
  {
    code: 'service',
    title: 'Ministry of Service & Church Stewardship',
    type: 'quiz',
    maxScore: 5.0,
    description: 'Servant leadership, faithfulness in stewardship, and honoring God with our gifts.',
  },
  {
    code: 'spiritual_authority',
    title: 'Spiritual Authority & Believer’s Rights',
    type: 'quiz',
    maxScore: 5.0,
    description: 'Exercising the authority of the believer in the Name of Jesus Christ.',
  },
  {
    code: 'holy_spirit',
    title: 'Person and Power of the Holy Spirit',
    type: 'quiz',
    maxScore: 5.0,
    description: 'The ministry of the Holy Spirit, spiritual baptism, gifts, and guidance.',
  },
  {
    code: 'prayer',
    title: 'Prevailing Prayer & Intercession',
    type: 'quiz',
    maxScore: 5.0,
    description: 'Principles of New Testament prayer, faith-filled petition, and intercession.',
  },
  {
    code: 'final_exam',
    title: 'CES Comprehensive Final Examination',
    type: 'final_exam',
    maxScore: 60.0,
    description: 'The culminating evaluation across all 8 modules of Christian discipleship.',
  },
];
