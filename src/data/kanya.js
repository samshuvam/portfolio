// Kanya rashi (Virgo), the traits, and the evidence. Every piece of evidence
// is something real from the work or the person.

export const traits = [
  { id: 'analytical', trait: 'Analytical', evidence: 'Didn’t trust a hunch about RAG. Built a 500-query benchmark and measured +203% instead.' },
  { id: 'perfectionist', trait: 'Perfectionist', evidence: 'Rebuilt this entire website from scratch. The old one was fine. Fine is not the point.' },
  { id: 'organised', trait: 'Organised', evidence: 'Moved a whole manufacturing company off a legacy CRM and onto Odoo ERP, QR codes and all.' },
  { id: 'detail', trait: 'Notices everything', evidence: 'Saw one launch photo and pointed out the internal display had a slightly too aggressive matte finish.' },
  { id: 'practical', trait: 'Practical', evidence: 'No bus-tracking API? Real coordinates and a Google Maps loophole. Problem solved.' },
  { id: 'overthinker', trait: 'Overthinker', evidence: 'Exhibit A: the café portrait further up. Hand on chin, still deciding.' },
  { id: 'communicator', trait: 'Communicator', evidence: 'Kanya is ruled by Budh, Mercury, the planet of speech. Hence the professional yapping.' },
  { id: 'helpful', trait: 'Of service', evidence: 'Built a hospital ERP so staff can pull up a patient’s history in seconds instead of digging through files.' },
];

// Virgo from the d3-celestial line set: [RA degrees, Dec degrees].
export const virgoLines = [
  [[176.4648, 6.5294], [177.6738, 1.7647], [184.9765, -0.6668], [190.4152, -1.4494], [197.4875, -5.539], [201.2982, -11.1613], [214.0036, -6.0005], [220.7651, -5.6582]],
  [[195.5442, 10.9592], [193.9009, 3.3975], [190.4152, -1.4494]],
  [[197.4875, -5.539], [203.6733, -0.5958], [210.4116, 1.5445], [221.5622, 1.8929]],
];

export const virgoNamed = [
  { name: 'Spica', alt: 'Chitra', ra: 201.2982, dec: -11.1613, mag: 0.98 },
  { name: 'Porrima', ra: 190.4152, dec: -1.4494, mag: 2.74 },
  { name: 'Vindemiatrix', ra: 195.5442, dec: 10.9592, mag: 2.85 },
  { name: 'Zavijava', ra: 177.6738, dec: 1.7647, mag: 3.59 },
  { name: 'Heze', ra: 203.6733, dec: -0.5958, mag: 3.38 },
];

// Background stars in the same patch of sky: [RA, Dec, magnitude].
export const virgoField = [
  [168.56, 15.43, 3.33], [169.17, -3.65, 4.45], [169.84, -14.78, 3.56], [170.28, 6.03, 4.05], [170.98, 10.53, 4], [171.15, -10.86, 4.81], [171.22, -17.68, 4.06], [171.98, 2.86, 4.95],
  [172.58, -3, 4.77], [174.17, -9.8, 4.7], [174.24, -0.82, 4.3], [174.62, 8.13, 5.24], [176.19, -18.35, 4.71], [176.32, 8.26, 4.84], [176.98, 8.25, 5.31], [177.26, 14.57, 2.14],
  [178.76, 8.44, 5.58], [179, -17.15, 5.17], [179.99, 3.66, 5.36], [180.19, -10.45, 5.54], [180.22, 6.61, 4.65], [181.3, 8.73, 4.12], [182.53, -22.62, 3.02], [183.95, -17.54, 2.58],
  [184, 14.9, 5.09], [185.09, 3.31, 4.97], [185.23, -13.57, 5.14], [187.47, -16.52, 2.94], [188.02, -16.2, 4.3], [188.44, -9.45, 5.48], [188.6, -23.4, 2.65], [189.81, -8, 4.66],
  [190.32, -13.01, 5.17], [190.47, 10.24, 4.88], [190.49, 6.81, 5.57], [191.4, 7.67, 5.22], [193.59, -9.54, 4.77], [194.73, 17.41, 4.76], [196.97, -10.74, 5.15], [197.14, -8.98, 5.57],
  [197.5, 17.53, 4.32], [198.01, -16.2, 5.04], [199.19, 9.42, 5.19], [199.4, 5.47, 4.78], [199.6, -18.31, 4.74], [199.73, -23.17, 2.99], [201.68, -12.71, 5.27], [201.86, -15.97, 4.76],
  [202.11, 13.78, 4.97], [202.99, -6.26, 4.68], [203.24, -10.16, 5.21], [203.53, 3.66, 4.92], [205.4, -8.7, 5.03], [205.77, 3.54, 5.35], [206.82, 17.46, 4.5], [207.37, 15.8, 4.05],
  [208.68, -1.5, 5.16], [211.68, -9.31, 5.46], [212.71, -16.3, 4.93], [213.07, 2.41, 4.99], [213.22, -10.27, 4.18], [214.78, -13.37, 4.52], [214.89, -2.27, 5.14], [215.84, 8.45, 4.86],
  [216.05, 5.82, 5.1], [217.05, -2.23, 4.81], [220.18, 16.42, 4.49], [220.29, 13.73, 3.78], [220.41, 8.16, 4.86], [221.31, 16.96, 4.6], [222.72, -16.04, 2.75], [222.75, -2.3, 4.93],
  [224.3, -4.35, 4.47], [225.73, 2.09, 4.39], [228.06, -19.79, 4.54], [229.25, -9.38, 2.61], [229.83, 1.77, 5.04], [231.05, -10.32, 4.92],
];
