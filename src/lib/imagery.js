// Contextual AI artwork. Personal photographs are reserved for Frames.
export const imagery = Object.fromEntries(['himalaya','janaki','panchthar','research','rhododendron','lumbini','vivah','window-v2','journey-birth','journey-hills','journey-lalitpur','journey-campus','journey-friends','sketch-arcade','sketch-tea','sketch-lumbini','sketch-mithila','postcard-janaki','journey-school','journey-bus','journey-intern','journey-icaast','journey-rover','journey-building','journey-associate','journey-memory','journey-segmented','journey-graduate','journey-now'].map(id=>[id,{id,src:`/imagery/${id}.webp`} ]));
export const contextImage = id => imagery[id];
export const contextAvatar = {src:'/imagery/avatar.svg',srcset:[{src:'/imagery/avatar.svg'}]};
