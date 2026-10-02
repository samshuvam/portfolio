// Contextual AI artwork. Personal photographs are reserved for Frames.
export const imagery = Object.fromEntries(['himalaya','janaki','panchthar','research','window','rhododendron','lumbini','vivah'].map(id=>[id,{id,src:`/imagery/${id}.webp`} ]));
export const contextImage = id => imagery[id];
export const contextAvatar = {src:'/imagery/avatar.svg',srcset:[{src:'/imagery/avatar.svg'}]};
