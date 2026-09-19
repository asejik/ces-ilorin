-- ==============================================================================
-- MIGRATION: 20260919_seed_quizzes_and_questions.sql
-- Citizens Elementary School (CES) Discipleship Training Platform
-- Classification: SEED DATA (Quizzes & Question Bank)
-- ==============================================================================

DO $$
DECLARE
  sem RECORD;
  q_salv UUID;
  q_rght UUID;
  q_word UUID;
  q_love UUID;
  q_serv UUID;
  q_auth UUID;
  q_spir UUID;
  q_pray UUID;
  q_exam UUID;
BEGIN
  -- Iterate through each active semester
  FOR sem IN SELECT id, name FROM ces_semesters WHERE is_active = true LOOP
    
    -- 1. SALVATION
    INSERT INTO ces_quizzes (semester_id, course_code, title, assessment_type, max_score, session_pin, is_open)
    VALUES (sem.id, 'salvation', 'Doctrine of Salvation', 'quiz', 5.00, 'SALV26', true)
    ON CONFLICT (semester_id, course_code) DO UPDATE SET title = EXCLUDED.title, session_pin = EXCLUDED.session_pin, is_open = EXCLUDED.is_open
    RETURNING id INTO q_salv;

    -- Questions for Salvation
    DELETE FROM ces_quiz_questions WHERE quiz_id = q_salv;
    INSERT INTO ces_quiz_questions (quiz_id, question_text, options, correct_option_index, marks, sort_order) VALUES
    (q_salv, 'According to Romans 10:9-10, what two actions are necessary for salvation?', '["Confessing sins and paying tithes", "Confessing with the mouth and believing in the heart", "Water baptism and fasting for 3 days", "Church membership and good moral conduct"]'::jsonb, 1, 1.00, 1),
    (q_salv, 'What is the primary gift given to a believer at the new birth?', '["Worldly wealth", "Eternal life (Zoe)", "Physical invulnerability", "Immediate theological mastery"]'::jsonb, 1, 1.00, 2),
    (q_salv, 'According to Ephesians 2:8-9, salvation is received through:', '["Personal good works", "Ancestral heritage", "Grace through faith", "Rigorous spiritual discipline"]'::jsonb, 2, 1.00, 3),
    (q_salv, 'In 2 Corinthians 5:17, what does it mean to be a "new creation"?', '["Reforming one''s bad habits", "The spirit man is made entirely new in Christ", "Changing physical appearance", "Joining a new religious denomination"]'::jsonb, 1, 1.00, 4),
    (q_salv, 'Jesus Christ accomplished our redemption primarily through:', '["His moral philosophies", "His shed blood on the cross and resurrection", "His political influence in Judea", "The construction of the temple"]'::jsonb, 1, 1.00, 5);

    -- 2. RIGHTEOUSNESS
    INSERT INTO ces_quizzes (semester_id, course_code, title, assessment_type, max_score, session_pin, is_open)
    VALUES (sem.id, 'righteousness', 'Righteousness of God', 'quiz', 5.00, 'RGHT26', true)
    ON CONFLICT (semester_id, course_code) DO UPDATE SET title = EXCLUDED.title, session_pin = EXCLUDED.session_pin, is_open = EXCLUDED.is_open
    RETURNING id INTO q_rght;

    DELETE FROM ces_quiz_questions WHERE quiz_id = q_rght;
    INSERT INTO ces_quiz_questions (quiz_id, question_text, options, correct_option_index, marks, sort_order) VALUES
    (q_rght, 'What is Biblical righteousness primarily defined as?', '["A feeling of moral superiority", "Right standing with God without guilt, fear, or condemnation", "Flawless legal obedience to the Mosaic law", "Public displays of religious fasting"]'::jsonb, 1, 1.00, 1),
    (q_rght, 'According to Romans 5:17, righteousness is received as:', '["A reward for long fasting", "A gift through Jesus Christ", "A certificate from the church council", "An inheritance from pious parents"]'::jsonb, 1, 1.00, 2),
    (q_rght, 'According to 2 Corinthians 5:21, who became sin for us that we might become the righteousness of God?', '["The Apostles", "John the Baptist", "Jesus Christ", "Moses"]'::jsonb, 2, 1.00, 3),
    (q_rght, 'What does righteousness give the believer boldness to do?', '["Approach the throne of grace with confidence", "Condemn and judge unbelievers", "Ignore all church authority", "Boast in human achievements"]'::jsonb, 0, 1.00, 4),
    (q_rght, 'Righteousness consciousness replaces which destructive mindset?', '["Prosperity mindset", "Sin consciousness and condemnation", "Joy and peace", "Humility"]'::jsonb, 1, 1.00, 5);

    -- 3. WORD OF GOD
    INSERT INTO ces_quizzes (semester_id, course_code, title, assessment_type, max_score, session_pin, is_open)
    VALUES (sem.id, 'word_of_god', 'Integrity of the Word of God', 'quiz', 5.00, 'WORD26', true)
    ON CONFLICT (semester_id, course_code) DO UPDATE SET title = EXCLUDED.title, session_pin = EXCLUDED.session_pin, is_open = EXCLUDED.is_open
    RETURNING id INTO q_word;

    DELETE FROM ces_quiz_questions WHERE quiz_id = q_word;
    INSERT INTO ces_quiz_questions (quiz_id, question_text, options, correct_option_index, marks, sort_order) VALUES
    (q_word, 'According to 2 Timothy 3:16, all Scripture is:', '["Written only by human imagination", "Inspired by God (God-breathed)", "Outdated historical literature", "Applicable only to the Old Testament Jews"]'::jsonb, 1, 1.00, 1),
    (q_word, 'According to Hebrews 4:12, the Word of God is described as:', '["Dead and inactive", "Alive and active, sharper than any two-edged sword", "A complex mystery meant for a few priests", "Temporary guidance for ancient times"]'::jsonb, 1, 1.00, 2),
    (q_word, 'How does faith come according to Romans 10:17?', '["By wishing and hoping", "By hearing the Word of God", "By observing natural miracles", "By philosophical reasoning"]'::jsonb, 1, 1.00, 3),
    (q_word, 'In Matthew 4:4, Jesus answered the tempter saying man shall not live by bread alone, but by:', '["Every decree of kings", "Human wisdom and education", "Every word that comes from the mouth of God", "Financial prosperity"]'::jsonb, 2, 1.00, 4),
    (q_word, 'Meditating on the Word of God day and night brings what result according to Joshua 1:8?', '["Spiritual arrogance", "Physical exhaustion", "Prosperous way and good success", "Isolation from church community"]'::jsonb, 2, 1.00, 5);

    -- 4. LOVE WALK
    INSERT INTO ces_quizzes (semester_id, course_code, title, assessment_type, max_score, session_pin, is_open)
    VALUES (sem.id, 'love_walk', 'The Love Walk & Christian Character', 'quiz', 5.00, 'LOVE26', true)
    ON CONFLICT (semester_id, course_code) DO UPDATE SET title = EXCLUDED.title, session_pin = EXCLUDED.session_pin, is_open = EXCLUDED.is_open
    RETURNING id INTO q_love;

    DELETE FROM ces_quiz_questions WHERE quiz_id = q_love;
    INSERT INTO ces_quiz_questions (quiz_id, question_text, options, correct_option_index, marks, sort_order) VALUES
    (q_love, 'What kind of love is shed abroad in our hearts by the Holy Spirit (Romans 5:5)?', '["Phileo (brotherly affection)", "Eros (romantic affection)", "Agape (unconditional God-kind of love)", "Storge (family affection)"]'::jsonb, 2, 1.00, 1),
    (q_love, 'According to 1 Corinthians 13:4-7, love is characterized by:', '["Envy and boasting", "Patience, kindness, and not seeking its own", "Quick temper and resentment", "Pride and arrogance"]'::jsonb, 1, 1.00, 2),
    (q_love, 'How will all people know that we are Jesus'' disciples (John 13:35)?', '["If we perform dramatic miracles", "If we have love for one another", "If we wear special religious garments", "If we speak with eloquence"]'::jsonb, 1, 1.00, 3),
    (q_love, 'Walking in love requires forgiving others as God in Christ forgave us. This is found in:', '["Ephesians 4:32", "Genesis 1:1", "Leviticus 11:4", "Proverbs 26:11"]'::jsonb, 0, 1.00, 4),
    (q_love, 'According to 1 John 4:18, what does perfect love do to fear?', '["Increases fear", "Drives out fear", "Justifies fear", "Ignores fear"]'::jsonb, 1, 1.00, 5);

    -- 5. SERVICE
    INSERT INTO ces_quizzes (semester_id, course_code, title, assessment_type, max_score, session_pin, is_open)
    VALUES (sem.id, 'service', 'Ministry of Service & Church Stewardship', 'quiz', 5.00, 'SERV26', true)
    ON CONFLICT (semester_id, course_code) DO UPDATE SET title = EXCLUDED.title, session_pin = EXCLUDED.session_pin, is_open = EXCLUDED.is_open
    RETURNING id INTO q_serv;

    DELETE FROM ces_quiz_questions WHERE quiz_id = q_serv;
    INSERT INTO ces_quiz_questions (quiz_id, question_text, options, correct_option_index, marks, sort_order) VALUES
    (q_serv, 'According to Mark 10:45, Jesus came not to be served, but to:', '["Be crowned king immediately", "Serve and give His life as a ransom for many", "Accumulate political followers", "Critique Roman government"]'::jsonb, 1, 1.00, 1),
    (q_serv, 'In Colossians 3:23-24, whatever we do in service should be done:', '["Begrudgingly to impress the pastor", "Heartily, as to the Lord and not unto men", "Only when publicly recognized", "With minimum effort"]'::jsonb, 1, 1.00, 2),
    (q_serv, 'Faithfulness in service is tested first in:', '["Great international platforms", "Little things and another man''s work (Luke 16:10-12)", "Public leadership roles", "Social media popularity"]'::jsonb, 1, 1.00, 3),
    (q_serv, 'What attitude should accompany Christian service according to Romans 12:11?', '["Slothfulness and delay", "Fervent in spirit, serving the Lord", "Complaining and disputing", "Seeking financial payback"]'::jsonb, 1, 1.00, 4),
    (q_serv, 'Every believer has received spiritual gifts for what primary purpose (1 Peter 4:10)?', '["Personal entertainment", "Ministering to one another as good stewards", "Exalting self over others", "Commercial profit"]'::jsonb, 1, 1.00, 5);

    -- 6. SPIRITUAL AUTHORITY
    INSERT INTO ces_quizzes (semester_id, course_code, title, assessment_type, max_score, session_pin, is_open)
    VALUES (sem.id, 'spiritual_authority', 'Spiritual Authority & Believer''s Rights', 'quiz', 5.00, 'AUTH26', true)
    ON CONFLICT (semester_id, course_code) DO UPDATE SET title = EXCLUDED.title, session_pin = EXCLUDED.session_pin, is_open = EXCLUDED.is_open
    RETURNING id INTO q_auth;

    DELETE FROM ces_quiz_questions WHERE quiz_id = q_auth;
    INSERT INTO ces_quiz_questions (quiz_id, question_text, options, correct_option_index, marks, sort_order) VALUES
    (q_auth, 'Where is the believer seated with Christ according to Ephesians 2:6?', '["In purgatory", "In earthly bondage", "In heavenly places in Christ Jesus", "At the judgment hall of Pilate"]'::jsonb, 2, 1.00, 1),
    (q_auth, 'According to Luke 10:19, what authority did Jesus give His disciples?', '["Authority over physical governments", "Authority to trample on serpents and scorpions, and over all the power of the enemy", "Authority to avoid all human duties", "Authority to condemn the world"]'::jsonb, 1, 1.00, 2),
    (q_auth, 'What is the primary instrument of the believer''s authority on earth?', '["The Name of Jesus Christ", "A wooden cross or physical relic", "Special blessed water", "Ceremonial incense"]'::jsonb, 0, 1.00, 3),
    (q_auth, 'According to James 4:7, how do we make the devil flee?', '["Begging him to leave", "Submitting to God and resisting the devil", "Negotiating terms with evil spirits", "Running away in panic"]'::jsonb, 1, 1.00, 4),
    (q_auth, 'According to Matthew 18:18, whatever the church binds on earth shall be:', '["Ignored in heaven", "Bound in heaven", "Debated by angels", "Temporarily postponed"]'::jsonb, 1, 1.00, 5);

    -- 7. HOLY SPIRIT
    INSERT INTO ces_quizzes (semester_id, course_code, title, assessment_type, max_score, session_pin, is_open)
    VALUES (sem.id, 'holy_spirit', 'Person and Power of the Holy Spirit', 'quiz', 5.00, 'SPIR26', true)
    ON CONFLICT (semester_id, course_code) DO UPDATE SET title = EXCLUDED.title, session_pin = EXCLUDED.session_pin, is_open = EXCLUDED.is_open
    RETURNING id INTO q_spir;

    DELETE FROM ces_quiz_questions WHERE quiz_id = q_spir;
    INSERT INTO ces_quiz_questions (quiz_id, question_text, options, correct_option_index, marks, sort_order) VALUES
    (q_spir, 'Who is the Holy Spirit according to Scripture?', '["An impersonal cosmic force or electricity", "The third Person of the Godhead, with mind, will, and emotions", "An angel sent from heaven", "A human state of deep enlightenment"]'::jsonb, 1, 1.00, 1),
    (q_spir, 'According to Acts 1:8, what does the believer receive when the Holy Spirit comes upon them?', '["Political authority", "Power (Dunamis) to be witnesses", "Exemption from all hardship", "Immunity from physical death"]'::jsonb, 1, 1.00, 2),
    (q_spir, 'What initial physical evidence accompanied the baptism in the Holy Spirit in Acts 2:4?', '["Laughter", "Speaking with other tongues as the Spirit gave utterance", "Falling asleep", "Seeing lightning bolts"]'::jsonb, 1, 1.00, 3),
    (q_spir, 'In John 14:16, Jesus promised the Father would send another Comforter (Parakletos), which means:', '["One called alongside to help, counsel, and strengthen", "A distant judge", "A harsh taskmaster", "A temporary advisor"]'::jsonb, 0, 1.00, 4),
    (q_spir, 'According to 1 Corinthians 14:4, he who speaks in an unknown tongue:', '["Confuses the church", "Edifies (builds up) himself", "Wastes precious time", "Sinfully shows off"]'::jsonb, 1, 1.00, 5);

    -- 8. PRAYER
    INSERT INTO ces_quizzes (semester_id, course_code, title, assessment_type, max_score, session_pin, is_open)
    VALUES (sem.id, 'prayer', 'Prevailing Prayer & Intercession', 'quiz', 5.00, 'PRAY26', true)
    ON CONFLICT (semester_id, course_code) DO UPDATE SET title = EXCLUDED.title, session_pin = EXCLUDED.session_pin, is_open = EXCLUDED.is_open
    RETURNING id INTO q_pray;

    DELETE FROM ces_quiz_questions WHERE quiz_id = q_pray;
    INSERT INTO ces_quiz_questions (quiz_id, question_text, options, correct_option_index, marks, sort_order) VALUES
    (q_pray, 'To whom does Jesus teach believers to pray in the New Testament (John 16:23)?', '["To departed saints", "To the Father in the Name of Jesus", "To the angels of God", "To religious icons"]'::jsonb, 1, 1.00, 1),
    (q_pray, 'According to Mark 11:24, when should a believer believe they have received what they pray for?', '["When they physically touch it", "When they pray", "After several months of sorrow", "Only if the pastor confirms it"]'::jsonb, 1, 1.00, 2),
    (q_pray, 'According to 1 John 5:14-15, our confidence in prayer is based on:', '["Praying according to His will (His Word)", "The volume of our shouting", "The length of our prayer session", "Our personal righteous deeds"]'::jsonb, 0, 1.00, 3),
    (q_pray, 'In 1 Thessalonians 5:17, believers are instructed to:', '["Pray only on Sundays", "Pray without ceasing", "Pray only when in severe distress", "Recite memorized chants"]'::jsonb, 1, 1.00, 4),
    (q_pray, 'According to James 5:16, the effectual fervent prayer of a righteous man:', '["Has very little impact", "Avails much / produces tremendous power", "Is only heard if done in church", "Requires monetary sacrifice"]'::jsonb, 1, 1.00, 5);

    -- 9. FINAL EXAMINATION
    INSERT INTO ces_quizzes (semester_id, course_code, title, assessment_type, max_score, session_pin, is_open)
    VALUES (sem.id, 'final_exam', 'CES Comprehensive Final Examination', 'final_exam', 60.00, 'EXAM26', true)
    ON CONFLICT (semester_id, course_code) DO UPDATE SET title = EXCLUDED.title, session_pin = EXCLUDED.session_pin, is_open = EXCLUDED.is_open
    RETURNING id INTO q_exam;

    DELETE FROM ces_quiz_questions WHERE quiz_id = q_exam;
    INSERT INTO ces_quiz_questions (quiz_id, question_text, options, correct_option_index, marks, sort_order) VALUES
    (q_exam, 'Comprehensive Doctrine: What constitutes the total foundation of the Christian discipleship journey in CES?', '["Occasional church attendance without study", "New birth in Christ, renewal of the mind through God''s Word, and active ministry of service", "Adhering strictly to ancestral traditions", "Memorizing religious philosophy without personal faith"]'::jsonb, 1, 12.00, 1),
    (q_exam, 'Righteousness & Identity: Explain how righteousness impacts a believer''s daily communion with God.', '["It causes feelings of shame and unworthiness", "It provides bold access to God''s throne without guilt, condemnation, or inferiority", "It requires constant animal sacrifices", "It makes prayer unnecessary"]'::jsonb, 1, 12.00, 2),
    (q_exam, 'Spiritual Authority: What is the primary basis of a believer''s authority over spiritual darkness?', '["Human physical strength and intellect", "The triumph of Jesus Christ in His death, burial, resurrection, and seating at the Father''s right hand", "Charms and sacred physical artifacts", "Denominational tradition"]'::jsonb, 1, 12.00, 3),
    (q_exam, 'Holy Spirit & Power: Describe the role of the Holy Spirit in personal discipleship and soul winning.', '["The Holy Spirit convicts, guides into all truth, empowers as a witness, and distributes spiritual gifts", "The Holy Spirit is merely a historical symbol", "The Holy Spirit replaces personal study of the Bible", "The Holy Spirit operates exclusively through ordained bishops"]'::jsonb, 0, 12.00, 4),
    (q_exam, 'Stewardship & Church Service: How does a disciple demonstrate commitment to the local assembly (Citizens of Light Church)?', '["Attending only when convenient", "Faithfully serving in a department, loving the brethren, submitting to leadership, and supporting the kingdom vision", "Criticizing leadership publicly", "Demanding financial honoraria for voluntary church tasks"]'::jsonb, 1, 12.00, 5);

  END LOOP;
END $$;
