# Rangeela Salon Radio — Test Report

## Playlist (STEP 4)
- **Checked:** 63 songs via `npm run verify:playlist` (YouTube oEmbed, 300 ms between requests).
- **Passed:** 63 OK, 0 FAIL. Result saved in `scripts/verify-result.json`.
- **Songs left without a video:** none.
- Every mood has at least 6 verified songs (baarish 8, romance 31, masti 22, dard 12, roadtrip 10, chai 15).
- All uploads are from official channels: YRF, T-Series / T-Series Bollywood Classics, Sony Music India, Tips Official / Ishtar Music, Saregama Music, Zee Music Company, Universal Music India, Vishesh Films, Rajshri.
- Notes: one initial oEmbed request failed with a transient network error (`ek-do-teen`) and passed on rerun; a few entries were replaced during verification because no official upload exists for them ("Chitthi Aayi Hai" (Naam), "Safar Suhaana" (Udaan), "Yaadon Ke Jharokhon Se", "Aankhon Se Gunaah" (No Entry)).
