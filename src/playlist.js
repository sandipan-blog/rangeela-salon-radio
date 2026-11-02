// Rangeela Salon Radio — song data (pure logic, no DOM/browser APIs).

export const MOODS = ['baarish', 'romance', 'masti', 'dard', 'roadtrip', 'chai'];

export const MOOD_INFO = {
  baarish: { label: 'Baarish', hindi: 'बारिश', emoji: '🌧️' },
  romance: { label: 'Romance', hindi: 'रोमांस', emoji: '💞' },
  masti: { label: 'Masti', hindi: 'मस्ती', emoji: '🕺' },
  dard: { label: 'Dard Bhare', hindi: 'दर्द भरे', emoji: '💔' },
  roadtrip: { label: 'Road Trip', hindi: 'सफ़र', emoji: '🛵' },
  chai: { label: 'Chai Time', hindi: 'चाय', emoji: '☕' }
};

export const SONGS = [
  // ---- Baarish ----
  { id: 'tujhe-dekha-to', title: 'Tujhe Dekha To', film: 'Dilwale Dulhania Le Jayenge', year: 1995, singers: ['Lata Mangeshkar', 'Kumar Sanu'], composer: 'Jatin-Lalit', moods: ['baarish', 'romance'], youtubeId: 'cNV5hLSa9H8' },
  { id: 'rimjhim-rimjhim', title: 'Rimjhim Rimjhim', film: '1942 A Love Story', year: 1994, singers: ['Kavita Krishnamurthy'], composer: 'R. D. Burman', moods: ['baarish', 'romance'], youtubeId: 'AMz6mnBo4Kc' },
  { id: 'barso-re-megha', title: 'Barso Re Megha', film: 'Guru', year: 2007, singers: ['Shreya Ghoshal', 'Uday Mazumdar'], composer: 'A. R. Rahman', moods: ['baarish', 'chai'], youtubeId: 'asw-wTDzGUQ' },
  { id: 'taal-se-taal-mila-alt', title: 'Taal Se Taal Mila (Alternate)', film: 'Taal', year: 1999, singers: ['Alka Yagnik', 'Udit Narayan'], composer: 'A. R. Rahman', moods: ['baarish', 'romance'], youtubeId: 'rjtUQAz2KsU' },
  { id: 'koi-ladki-hai', title: 'Koi Ladki Hai', film: 'Dil To Pagal Hai', year: 1997, singers: ['Udit Narayan', 'Lata Mangeshkar'], composer: 'Uttam Singh', moods: ['baarish', 'romance'], youtubeId: 'u6bk53x2Kno' },
  { id: 'ishq-di-galli-vich', title: 'Ishq Di Galli Vich', film: 'No Entry', year: 2005, singers: ['Sonu Nigam', 'Alisha Chinai'], composer: 'Anu Malik', moods: ['masti'], youtubeId: 'ypSSrlyi5RQ' },
  { id: 'jo-haal-dil-ka', title: 'Jo Haal Dil Ka', film: 'Sarfarosh', year: 1999, singers: ['Alka Yagnik', 'Kumar Sanu'], composer: 'Jatin-Lalit', moods: ['baarish', 'romance'], youtubeId: 'Y9OnEE7FAcc' },
  { id: 'ghar-se-nikalte-hi', title: 'Ghar Se Nikalte Hi', film: 'Papa Kehte Hain', year: 1996, singers: ['Udit Narayan'], composer: 'Rajesh Roshan', moods: ['baarish', 'romance'], youtubeId: '0NT-xmLX4tk' },
  { id: 'chaaha-to-bahut', title: 'Chaaha To Bahut', film: 'Imtihan', year: 1994, singers: ['Kumar Sanu'], composer: 'Anu Malik', moods: ['baarish', 'romance'], youtubeId: '00V7IokvbTA' },

  // ---- Romance ----
  { id: 'pehla-nasha', title: 'Pehla Nasha', film: 'Jo Jeeta Wohi Sikandar', year: 1992, singers: ['Udit Narayan', 'Sadhana Sargam'], composer: 'Jatin-Lalit', moods: ['romance'], youtubeId: 'iSUK1QoK9-E' },
  { id: 'mera-dil-tere-liye', title: 'Mera Dil Tere Liye', film: 'Aashiqui', year: 1990, singers: ['Udit Narayan', 'Anuradha Paudwal'], composer: 'Nadeem-Shravan', moods: ['romance'], youtubeId: 'WVUKkQo4SWU' },
  { id: 'ab-tere-bin', title: 'Ab Tere Bin Jee Lenge Hum', film: 'Aashiqui', year: 1990, singers: ['Kumar Sanu'], composer: 'Nadeem-Shravan', moods: ['romance', 'dard'], youtubeId: 'rTatsmUgmiA' },
  { id: 'tujhe-yaad-na-meri', title: 'Tujhe Yaad Na Meri Aayi', film: 'Kuch Kuch Hota Hai', year: 1998, singers: ['Udit Narayan', 'Alka Yagnik', 'Manpreet Akhtar'], composer: 'Jatin-Lalit', moods: ['romance', 'dard'], youtubeId: 'vzWWTX83C_Q' },
  { id: 'ladki-kyun', title: 'Ladki Kyun', film: 'Hum Tum', year: 2004, singers: ['Sonu Nigam', 'Alka Yagnik'], composer: 'Jatin-Lalit', moods: ['romance', 'masti'], youtubeId: '6WLugDJYXmM' },
  { id: 'maine-pyaar-kiya', title: 'Aaja Shaam Hone Aayi', film: 'Maine Pyar Kiya', year: 1989, singers: ['S. P. Balasubrahmanyam', 'Lata Mangeshkar'], composer: 'Raamlaxman', moods: ['romance'], youtubeId: 'YKy-I7q5Kn0' },
  { id: 'kuch-kuch-hota-hai', title: 'Kuch Kuch Hota Hai', film: 'Kuch Kuch Hota Hai', year: 1998, singers: ['Udit Narayan', 'Alka Yagnik'], composer: 'Jatin-Lalit', moods: ['romance'], youtubeId: '1QdbY4hEubw' },
  { id: 'aankhon-ki-gustaakhiyan', title: 'Aankhon Ki Gustaakhiyan', film: 'Hum Dil De Chuke Sanam', year: 1999, singers: ['Kumar Sanu', 'Kavita Krishnamurthy'], composer: 'Ismail Darbar', moods: ['romance'], youtubeId: 'VxuhxfZPOU0' },
  { id: 'chand-chhupa-badal', title: 'Chand Chhupa Badal Mein', film: 'Hum Dil De Chuke Sanam', year: 1999, singers: ['Udit Narayan', 'Alka Yagnik'], composer: 'Ismail Darbar', moods: ['romance'], youtubeId: 'ndlc50MADSY' },
  { id: 'piyu-bole', title: 'Piyu Bole', film: 'Parineeta', year: 2005, singers: ['Sonu Nigam', 'Shreya Ghoshal'], composer: 'Shantanu Moitra', moods: ['romance', 'chai'], youtubeId: 'ZAkr0KFFLLs' },
  { id: 'tum-se-hi', title: 'Tum Se Hi', film: 'Jab We Met', year: 2007, singers: ['Mohit Chauhan'], composer: 'Pritam', moods: ['romance'], youtubeId: 'mt9xg0mmt28' },
  { id: 'maine-yeh-kab-socha', title: 'Aye Mere Humsafar', film: 'Qayamat Se Qayamat Tak', year: 1988, singers: ['Udit Narayan', 'Alka Yagnik'], composer: 'Anand-Milind', moods: ['romance', 'roadtrip'], youtubeId: 'sWqjZpBtcxc' },

  // ---- Masti ----
  { id: 'koi-kahe-kehta-rahe', title: 'Koi Kahe Kehta Rahe', film: 'Dil Chahta Hai', year: 2001, singers: ['Shankar Mahadevan', 'KK', 'Shaan'], composer: 'Shankar-Ehsaan-Loy', moods: ['masti'], youtubeId: 'ctJI7pCbxAo' },
  { id: 'tanhayee', title: 'Tanhayee', film: 'Dil Chahta Hai', year: 2001, singers: ['Sonu Nigam'], composer: 'Shankar-Ehsaan-Loy', moods: ['dard'], youtubeId: 'Q0UlQ_-YyjU' },
  { id: 'woh-ladki-hai-kahan', title: 'Woh Ladki Hai Kahan', film: 'Dil Chahta Hai', year: 2001, singers: ['Shankar Mahadevan', 'Kavita Krishnamurthy'], composer: 'Shankar-Ehsaan-Loy', moods: ['masti', 'romance'], youtubeId: 'IIg8H60bRJo' },
  { id: 'kambakkht-ishq', title: 'Kambakkht Ishq', film: 'Pyaar Tune Kya Kiya', year: 2001, singers: ['Sonu Nigam', 'Asha Bhosle'], composer: 'Sandeep Chowta', moods: ['masti'], youtubeId: 'pSHA0RBax4I' },
  { id: 'ek-do-teen', title: 'Ek Do Teen', film: 'Tezaab', year: 1988, singers: ['Alka Yagnik'], composer: 'Laxmikant-Pyarelal', moods: ['masti'], youtubeId: '9aUmlOzlHTc' },
  { id: 'choli-ke-peche', title: 'Choli Ke Peeche', film: 'Khal Nayak', year: 1993, singers: ['Alka Yagnik', 'Ila Arun'], composer: 'Laxmikant-Pyarelal', moods: ['masti'], youtubeId: '3OXiqmUhB70' },
  { id: 'muqabla-muqabla', title: 'Muqabla Muqabla', film: 'Humse Hai Muqabla', year: 1995, singers: ['Udit Narayan', 'K. S. Chithra'], composer: 'A. R. Rahman', moods: ['masti'], youtubeId: 'FQzC23GLptE' },
  { id: 'urvasi-urvasi', title: 'Urvasi Urvasi', film: 'Humse Hai Muqabla', year: 1995, singers: ['A. R. Rahman', 'Shankar Mahadevan'], composer: 'A. R. Rahman', moods: ['masti'], youtubeId: 'dkedupX73xs' },
  { id: 'what-is-your-mobile-number', title: 'What Is Your Mobile Number', film: 'Haseena Maan Jaayegi', year: 1999, singers: ['Sonu Nigam', 'Alka Yagnik'], composer: 'Anu Malik', moods: ['masti'], youtubeId: 'ict_iHC25rY' },
  { id: 'ola-ola', title: 'O O Jaane Jaana', film: 'Pyaar Kiya To Darna Kya', year: 1998, singers: ['Kamaal Khan'], composer: 'Jatin-Lalit', moods: ['masti'], youtubeId: 'x_elT6zkqN0' },
  { id: 'mauja-hi-mauja', title: 'Mauja Hi Mauja', film: 'Jab We Met', year: 2007, singers: ['Mika Singh'], composer: 'Pritam', moods: ['masti'], youtubeId: 'PaDaoNnOQaM' },

  // ---- Dard Bhare ----
  { id: 'tadap-tadap', title: 'Tadap Tadap Ke', film: 'Hum Dil De Chuke Sanam', year: 1999, singers: ['Kumar Sanu', 'Dominique Cerejo'], composer: 'Ismail Darbar', moods: ['dard'], youtubeId: 'KwiDJclWo44' },
  { id: 'aankhein-aur-ansoo', title: 'Jab Koi Baat Bigad Jaye', film: 'Jurm', year: 1990, singers: ['Kumar Sanu', 'Alka Yagnik'], composer: 'Rajesh Roshan', moods: ['dard', 'romance'], youtubeId: 'mNSYPtzpfd4' },
  { id: 'koi-mil-gaya', title: 'Koi Mil Gaya', film: 'Kuch Kuch Hota Hai', year: 1998, singers: ['Udit Narayan', 'Alka Yagnik'], composer: 'Jatin-Lalit', moods: ['masti'], youtubeId: 'XWmon1qR6pM' },
  { id: 'yun-hi-chala-chal', title: 'Yun Hi Chala Chal', film: 'Swades', year: 2004, singers: ['Udit Narayan', 'Hariharan', 'Kailash Kher'], composer: 'A. R. Rahman', moods: ['roadtrip'], youtubeId: '259wjv5-5NE' },
  { id: 'jis-din-se-mainne', title: 'Bahut Pyar Karte Hain', film: 'Saajan', year: 1991, singers: ['Anuradha Paudwal'], composer: 'Nadeem-Shravan', moods: ['dard', 'romance'], youtubeId: 'ycj1FwxiZwc' },
  { id: 'jag-soona-soona-lage', title: 'Jag Soona Soona Lage', film: 'Om Shanti Om', year: 2007, singers: ['Rahul Vaidya', 'Shreya Ghoshal'], composer: 'Vishal-Shekhar', moods: ['dard'], youtubeId: 'p1sEacglZvg' },
  { id: 'kaise-mujhe', title: 'Kaise Mujhe Tum Mil Gayi', film: 'Ghajini', year: 2008, singers: ['Benny Dayal', 'Shreya Ghoshal'], composer: 'A. R. Rahman', moods: ['dard', 'romance'], youtubeId: 'OJVKIvKFmWk' },
  { id: 'tu-hi-meri-shab', title: 'Tu Hi Meri Shab Hai', film: 'Gangster', year: 2006, singers: ['KK'], composer: 'Pritam', moods: ['dard', 'romance'], youtubeId: 'mWBvudKcByg' },
  { id: 'jaadu-hai-nasha', title: 'Jaadu Hai Nasha Hai', film: 'Jism', year: 2003, singers: ['Shreya Ghoshal', 'Shaan'], composer: 'M. M. Keeravani', moods: ['romance'], youtubeId: 'gTSL0Rv0am4' },
  { id: 'tujhe-bhula-diya', title: 'Tujhe Bhula Diya', film: 'Anjaana Anjaani', year: 2010, singers: ['Mohit Chauhan', 'Shekhar Ravjiani', 'Shruti Pathak'], composer: 'Vishal-Shekhar', moods: ['dard'], youtubeId: '-Hb2DeHvvEg' },

  // ---- Road Trip ----
  { id: 'dil-chahta-hai-title', title: 'Dil Chahta Hai', film: 'Dil Chahta Hai', year: 2001, singers: ['Shankar Mahadevan'], composer: 'Shankar-Ehsaan-Loy', moods: ['roadtrip', 'masti'], youtubeId: 'mgF6SGtEr6g' },
  { id: 'hum-bhi-hain-tumhare', title: 'Sooraj Hua Madham', film: 'Kabhi Khushi Kabhie Gham', year: 2001, singers: ['Sonu Nigam', 'Alka Yagnik'], composer: 'Jatin-Lalit', moods: ['romance'], youtubeId: 'L0zKs8i7Nc8' },
  { id: 'nagada-nagada', title: 'Nagada Nagada', film: 'Jab We Met', year: 2007, singers: ['Sonu Nigam', 'Javed Ali'], composer: 'Pritam', moods: ['roadtrip', 'masti'], youtubeId: '0gtDICWPTyA' },
  { id: 'yeh-dil-dewana', title: 'Yeh Dil Deewana', film: 'Pardes', year: 1997, singers: ['Sonu Nigam'], composer: 'Nadeem-Shravan', moods: ['roadtrip', 'masti'], youtubeId: 'T4wr-y_bqB8' },
  { id: 'i-am-a-hero', title: 'Mitwa', film: 'Lagaan', year: 2001, singers: ['Udit Narayan', 'Alka Yagnik', 'Sukhwinder Singh'], composer: 'A. R. Rahman', moods: ['roadtrip'], youtubeId: 'uC3DmRfEigg' },
  { id: 'chak-de-phatte', title: 'Chak De Phatte', film: 'Khosla Ka Ghosla', year: 2006, singers: ['Kailash Kher', 'Paresh Kamath'], composer: 'Dhruv Dhalla', moods: ['roadtrip', 'masti'], youtubeId: 'gz00gYCzkMU' },
  { id: 'delhi-6-title', title: 'Masakali', film: 'Delhi-6', year: 2009, singers: ['Mohit Chauhan'], composer: 'A. R. Rahman', moods: ['roadtrip', 'chai'], youtubeId: 'a_ZPz_sxzY8' },
  { id: 'patshala', title: 'Patshala', film: 'Rang De Basanti', year: 2006, singers: ['Naresh Iyer', 'Mohammed Aslam'], composer: 'A. R. Rahman', moods: ['roadtrip', 'masti'], youtubeId: 'FC6BBII9Qs8' },
  { id: 'lukka-chhupi', title: 'Lukka Chhupi', film: 'Rang De Basanti', year: 2006, singers: ['Lata Mangeshkar', 'A. R. Rahman'], composer: 'A. R. Rahman', moods: ['dard', 'chai'], youtubeId: 'FFpgYjL2aJo' },
  { id: 'apni-to-paathshala', title: 'Roobaroo', film: 'Rang De Basanti', year: 2006, singers: ['Naresh Iyer', 'A. R. Rahman'], composer: 'A. R. Rahman', moods: ['roadtrip'], youtubeId: '8kMv5ssr6Dw' },

  // ---- Chai Time ----
  { id: 'chaiyya-chaiyya', title: 'Chaiyya Chaiyya', film: 'Dil Se', year: 1998, singers: ['Sukhwinder Singh', 'Sapna Awasthi'], composer: 'A. R. Rahman', moods: ['chai', 'masti'], youtubeId: 'lZLxjLYyhYQ' },
  { id: 'genda-phool', title: 'Genda Phool', film: 'Delhi-6', year: 2009, singers: ['Ragini Khanna', ' Rekha Bhardwaj'], composer: 'A. R. Rahman', moods: ['chai'], youtubeId: 'rjKU6Gk9b7A' },
  { id: 'radha-kaise-na-jale', title: 'Radha Kaise Na Jale', film: 'Lagaan', year: 2001, singers: ['Udit Narayan', 'Ashwini Bhide'], composer: 'A. R. Rahman', moods: ['chai', 'romance'], youtubeId: 'qNnvL0ztJhA' },
  { id: 'barso-re-chai', title: 'Bholi Si Surat', film: 'Dil To Pagal Hai', year: 1997, singers: ['Udit Narayan', 'Lata Mangeshkar'], composer: 'Uttam Singh', moods: ['romance', 'chai'], youtubeId: 'IsPOtygII-Q' },
  { id: 'main-hoon-hero', title: 'Main Agar Kahoon', film: 'Om Shanti Om', year: 2007, singers: ['Sonu Nigam', 'Shreya Ghoshal'], composer: 'Vishal-Shekhar', moods: ['chai', 'romance'], youtubeId: 'o-Gmhk90JOE' },
  { id: 'mera-kuch-samaan', title: 'Mera Kuch Samaan', film: 'Ijaazat', year: 1987, singers: ['Asha Bhosle'], composer: 'R. D. Burman', moods: ['dard', 'chai'], youtubeId: '6i9YxZKnQeY' },
  { id: 'kajra-re', title: 'Kajra Re', film: 'Bunty Aur Babli', year: 2005, singers: ['Alisha Chinai', 'Shankar Mahadevan', 'Javed Ali'], composer: 'Shankar-Ehsaan-Loy', moods: ['masti', 'chai'], youtubeId: '4dsFQFCvVGU' },
  { id: 'dola-re-dola', title: 'Dola Re Dola', film: 'Devdas', year: 2002, singers: ['Kavita Krishnamurthy', 'Shreya Ghoshal'], composer: 'Ismail Darbar', moods: ['masti', 'chai'], youtubeId: 'B4HbUt58eFU' },
  { id: 'sajan-ji-ghar-aye', title: 'Sajan Ji Ghar Aaye', film: 'Kuch Kuch Hota Hai', year: 1998, singers: ['Alka Yagnik', 'Udit Narayan'], composer: 'Jatin-Lalit', moods: ['chai', 'masti'], youtubeId: '8XtXLVylOoU' },
  { id: 'ishq-bina', title: 'Ishq Bina', film: 'Taal', year: 1999, singers: ['Sonu Nigam', 'Anuradha Sriram'], composer: 'A. R. Rahman', moods: ['romance', 'chai'], youtubeId: 'XG2RLhSIOLg' },
  { id: 'taal-se-taal', title: 'Taal Se Taal Mila', film: 'Taal', year: 1999, singers: ['Alka Yagnik', 'Udit Narayan'], composer: 'A. R. Rahman', moods: ['romance', 'chai'], youtubeId: '8YqerfkvzyA' }
];

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function validateSongs(list) {
  const errors = [];
  const ids = new Set();
  const ytIds = new Set();
  for (const s of list) {
    if (!s || typeof s !== 'object') { errors.push('not a song object'); continue; }
    for (const f of ['id', 'title', 'film', 'year', 'singers', 'composer', 'moods']) {
      if (s[f] === undefined || s[f] === null || s[f] === '') errors.push(`${s.id || '(no id)'}: missing field ${f}`);
    }
    if (!('youtubeId' in s)) errors.push(`${s.id || '(no id)'}: missing field youtubeId`);
    if (typeof s.year === 'number' && (s.year < 1985 || s.year > 2012)) errors.push(`${s.id}: year ${s.year} outside 1985-2012`);
    if (Array.isArray(s.moods)) {
      for (const m of s.moods) if (!MOODS.includes(m)) errors.push(`${s.id}: unknown mood "${m}"`);
    }
    if (s.id) {
      if (ids.has(s.id)) errors.push(`duplicate id "${s.id}"`);
      ids.add(s.id);
    }
    if (s.youtubeId) {
      if (!ID_RE.test(s.youtubeId)) errors.push(`${s.id}: bad youtubeId "${s.youtubeId}"`);
      if (ytIds.has(s.youtubeId)) errors.push(`duplicate youtubeId "${s.youtubeId}"`);
      ytIds.add(s.youtubeId);
    }
  }
  return errors;
}

export function playableSongs(list, disabled = new Set()) {
  return list.filter(s => s.youtubeId && ID_RE.test(s.youtubeId) && !disabled.has(s.youtubeId));
}

export function songLabel(s) {
  return `${s.title} · ${s.film} (${s.year})`;
}
