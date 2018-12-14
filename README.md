This assignment is developed for credits of CSC 561.

#Part 1
To render unlit triangles, set light = false in javascript code at line 881.

For Part 2 and onwards, set light = true at line 881
#Part 2
Render lit triangles using Blinn Phong Illumination Model as default while loading shaders.

#Part 3
Interactively change view of triangles as below:
Translates by factor of 0.08, rotates by Math.PI/180
    a and d — translate view left and right along view X
    w and s — translate view forward and backward along view Z
    q and e — translate view up and down along view Y
    A and D — rotate view left and right around view Y (yaw)
    W and S — rotate view forward and backward around view X (pitch)

#Part 4
Interactively select model from set
    left and right — select and highlight the next/previous triangle set (previous off)
    space — deselect and turn off highlight

#Part 5
Interactively change lighting on a model
    b — toggle between Phong and Blinn-Phong lighting (applies to all the models)
    n — increment the specular integer exponent by 1 (wrap from 20 to 0)
    1 — increase the ambient weight by 0.1 (wrap from 1 to 0)
    2 — increase the diffuse weight by 0.1 (wrap from 1 to 0)
    3 — increase the specular weight by 0.1 (wrap from 1 to 0)

#Part 6
Interactively transform model
    k and ; — translate selection left and right along view X
    o and l — translate selection forward and backward along view Z
    i and p — translate selection up and down along view Y
    K and : — rotate selection left and right around view Y (yaw)
    O and L — rotate selection forward and backward around view X (pitch)
    I and P — rotate selection clockwise and counterclockwise around view Z (roll)

#extra-credits finished
1. smooth shading with vertex normals

Department of Computer Science, North Carolina State University, Raleigh.
