# FlightGear cabin source

The textured first-class seating model is from **franck-vmd / Boeing-777-Flightgear**, `777-VMD/Models/Seating/Sieges777.ac` and its `chambreensemble.png` / `vitres.png` textures.

Source: https://github.com/franck-vmd/Boeing-777-Flightgear/tree/main/777-VMD/Models/Seating
License: GNU GPL version 2, included as `LICENSE`.

The original mesh and textures are included here. The derived `../cabin-first-class.glb` centres the mesh, triangulates its surfaces and converts its texture/material data to glTF. It remains under the GPL. The conversion source is available in the public repository at `scripts/build-cabin.py`.

This is a first-class Boeing cabin adapted as a visual seating scene; it is not presented as an exact A350 interior scan.
