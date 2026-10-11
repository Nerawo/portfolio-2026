#######################################
# assignment_3_2.py
# Newtons Cradle
# by Lu Zhang
# Date Created: 2026-03-04
#######################################

##########################################################################################
################ PUT THIS AT THE TOP OF ANY CODE YOU'RE WRITING FOR MAYA  ################
##########################################################################################
                                                                                         #
try:                                                                                     #
    import maya.cmds as cmds                                                             #
    IN_MAYA = True                                                                       #
except ImportError:                                                                      #
    IN_MAYA = False                                                                      #
                                                                                         #
                                                                                         #
    class MockCmds:                                                                      #
        def __getattr__(self, name):                                                     #
            def mock(*args, **kwargs):                                                   #
                print(f"[MOCK] cmds.{name}({args}, {kwargs})")                           #
                return ["mock_result"]  # return list for things like ls()               #
            return mock                                                                  #
                                                                                         #
    cmds = MockCmds()                                                                    #
                                                                                         #
                                                                                         #
##########################################################################################
##########################################################################################
##########################################################################################
import math
import os
import mtoa as ai

#prefix
PFX = "LZ_"
# start frame
s = 1
# end frame
n = 12 
PI = math.pi



file_path = r"D:\work_scad\vfx705\assignment_3\WI26_VFX705_02_Lu_Zhang_P03_NewtonsCradle_FINAL_v02"
file_names = [
    r"rural_asphalt_road_4k.exr",
]

out_path = r"D:\work_scad\vfx705\assignment_3\WI26_VFX705_02_Lu_Zhang_P03_NewtonsCradle_FINAL_v02\render_folder" 

# cmds.setAttr("defaultRenderGlobals.imageFilePrefix", os.path.join(out_path, "myTestRender"), type="string")

tile_palette_dict = {
    "green_grass": [[0.55,0.8,0.23],[0.42,0.77,0.2]],
    "sheep_furr": [[1,1,1],[0.9,0.9,0.9]],
    "rope" :[[0.2,0.15,0.1],[0.36,0.3,0.2]],
    "black_face" : [[0,0,0],[0,0,0]]
}

def cleanup_scene():
    if cmds.objExists(f"{PFX}*"):
        cmds.delete(f"{PFX}*")
        cmds.grid(toggle=False)


def build_sheep(posX=0.0, posY=0.0, posZ=0.0, size=1.0, name="sheep",reverse = False, single = False):

    def set_trs(node, t=None, r=None, s=None):
        if t is not None:
            cmds.setAttr(node + ".translate", t[0], t[1], t[2], type="double3")
        if r is not None:
            cmds.setAttr(node + ".rotate", r[0], r[1], r[2], type="double3")
        if s is not None:
            cmds.setAttr(node + ".scale", s[0], s[1], s[2], type="double3")


    def make_sphere(n, scale=0.5):
        s = cmds.polySphere(n=n, r=1, sx=20, sy=20, ax=(0, 1, 0), cuv=2, ch=True)[0]
        cmds.scale(scale, scale, scale, s, r=True)
        return s

    # BODY
    def build_body():
        COUNT         = 6
        RING_RADIUS   = 0.45
        START_ANGLE   = -20.0

        ring1_spheres = []
        for i in range(COUNT):
            angle_deg = START_ANGLE + (360.0 / COUNT) * i
            a = math.radians(angle_deg)

            x = math.cos(a) * RING_RADIUS
            z = math.sin(a) * RING_RADIUS
            s = cmds.polySphere(n=f"ring_{i+1}", r=0.5, sx=20, sy=20, ax=(0, 1, 0), cuv=2, ch=True)[0]
            cmds.move(x, 0, z, s, ws=True, a=True)
            cmds.polySmooth(s,dv=1,ch=False); 
            cmds.makeIdentity(s, apply=True, t=0, r=0, s=1, n=0)
            # delete history
            cmds.delete(s, ch=True)
            cmds.hyperShade(assign=f"{PFX}sheep_furr_shader_mat")
            ring1_spheres.append(s)


        ring_group1 = cmds.group(ring1_spheres, n=PFX + "ring_group1")
        cmds.rotate(0, 0, 90, ring_group1, r=True, os=True)
        cmds.xform(ring_group1, centerPivots=True)

        ring_group2 = cmds.duplicate(ring_group1, n=PFX + "ring_group2")[0]
        cmds.rotate(0, 30, 0, ring_group2, r=True, os=True)
        cmds.move(RING_RADIUS, 0, 0, ring_group2, r=True, ws=True)

        ring_group3 = cmds.duplicate(ring_group1, n=PFX + "ring_group3")[0]
        cmds.move(RING_RADIUS * 2, 0, 0, ring_group3, r=True, ws=True)

        # centers
        c1 = make_sphere(PFX + "centerSphere1", scale=0.5)
        pos1 = cmds.xform(ring_group1, q=True, ws=True, rp=True)
        cmds.move(pos1[0] - 0.15, pos1[1], pos1[2], c1, ws=True)
        cmds.delete(c1, ch=True)
        cmds.hyperShade(assign=f"{PFX}sheep_furr_shader_mat")

        c3 = make_sphere(PFX + "centerSphere3", scale=0.5)
        pos3 = cmds.xform(ring_group3, q=True, ws=True, rp=True)
        cmds.move(pos3[0] + 0.15, pos3[1], pos3[2], c3, ws=True)
        cmds.delete(c3, ch=True)
        cmds.hyperShade(assign=f"{PFX}sheep_furr_shader_mat")

        s_body = PFX + "s_body"
        s_body = cmds.group([ring_group1, ring_group2, ring_group3, c1, c3], n=s_body)
        cmds.xform(s_body, centerPivots=True)
        return s_body

    # HEAD
    def build_head():

        # ===== face =====
        s_face = cmds.polyCube(n=PFX + "s_face", w=1, h=1, d=1, sx=1, sy=4, sz=4, ax=(0, 1, 0), cuv=4, ch=True)[0]


        # Base scaling
        cmds.scale(0.196115, 1.0, 1.0, s_face, r=True)
        cmds.scale(1.0, 0.826921, 0.826921, s_face, r=True)
        cmds.makeIdentity(s_face, apply=True, t=1, r=1, s=1, n=0)

        # Vertex shaping (use f"{s_face}.vtx[...]")
        cmds.scale(1.0, 1.0, 0.820822,
                   [f"{s_face}.vtx[0:3]", f"{s_face}.vtx[22:34]", f"{s_face}.vtx[41:43]"],
                   r=True, p=(0.0, -0.310095, 0.0))

        cmds.scale(1.0, 1.0, 0.395402,
                   [f"{s_face}.vtx[0:1]", f"{s_face}.vtx[24:31]"],
                   r=True, p=(0.0, -0.413461, 0.0))

        cmds.move(0.0, 0.0066092, 0.0,
                  [f"{s_face}.vtx[24:27]", f"{s_face}.vtx[0]", f"{s_face}.vtx[30]"],
                  r=True, os=True, wd=True)

        cmds.move(0.0, 0.034754, 0.0,
                  [f"{s_face}.vtx[24:25]", f"{s_face}.vtx[0:1]"],
                  r=True, os=True, wd=True)

        cmds.scale(1.0, 1.0, 0.811111, [f"{s_face}.vtx[8:17]"], r=True, p=(0.0, 0.413461, 0.0))
        cmds.move(0.0, -0.013327, 0.0,
                  [f"{s_face}.vtx[14:17]", f"{s_face}.vtx[8:11]"],
                  r=True, os=True, wd=True)

        cmds.move(0.0, -0.0870124, 0.0,
                  [f"{s_face}.vtx[16:17]", f"{s_face}.vtx[8:9]"],
                  r=True, os=True, wd=True)

        cmds.scale(1.555556, 1.0, 1.0, [f"{s_face}.vtx[32:49]"], r=True, p=(0.0, 0.0, 0.0))
        cmds.scale(1.322715, 1.0, 1.0, [f"{s_face}.vtx[36]", f"{s_face}.vtx[45]"], r=True, p=(0.0, 0.0, 0.0))
        cmds.scale(0.955522, 1.0, 1.0, [f"{s_face}.vtx[36]", f"{s_face}.vtx[45]"], r=True, p=(0.0, 0.0, 0.0))

        vtx_sel = [
            f"{s_face}.vtx[0:1]",
            f"{s_face}.vtx[24:25]",
            f"{s_face}.vtx[27]",
            f"{s_face}.vtx[29]",
            f"{s_face}.vtx[31]"
        ]
        cmds.move(0.0, 0.0313845, 0.0, vtx_sel, r=True, os=True, wd=True)
        cmds.scale(1.0, 1.0, 1.5, vtx_sel, r=True, p=(0.0, -0.361394, 0.0))

        cmds.scale(1.0, 1.0, 1.488889,
                   [f"{s_face}.vtx[26]", f"{s_face}.vtx[30]"],
                   r=True, p=(-0.0980575, -0.406851, 0.0))

        cmds.move(0.0, 0.014317, 0.0, s_face, r=True, os=True, wd=True)

        # dv=2 --- divided 2 times
        # ch=False --- delete history
        cmds.polySmooth(s_face,dv=2,ch=False)
        cmds.delete(s_face, ch=True)
        cmds.hyperShade(assign=f"{PFX}black_face_shader_mat")

        # ===== ear =====
        s_ear = cmds.polyCube(w=1, h=1, d=1, sx=2, sy=2, sz=2, ax=(0, 1, 0), cuv=4, ch=True, n=PFX + "s_ear")[0]

        cmds.scale(0.1046, 0.3265, 1.0000, s_ear, r=True)
        cmds.move(0.0000, 0.1244, 0.5892, s_ear, r=True, os=True, wd=True)
        cmds.scale(1.0000, 1.0000, 0.5412, s_ear, r=True)

        cmds.makeIdentity(s_ear, apply=True, t=1, r=1, s=1, n=0)

       # vertex edits (NO cmds.select)

        # vtx[12:20]
        cmds.scale(
            1.0, 0.3053, 1.0,
            f"{s_ear}.vtx[12:20]",
            r=True, p=(0.0, 0.1244, 0.3946)
        )
        cmds.move(
            0.0, 0.1020, 0.0,
            f"{s_ear}.vtx[12:20]",
            r=True, os=True, wd=True
        )

        # vtx[9:11] + vtx[21:25]
        ear_vtx_9_11_21_25 = [f"{s_ear}.vtx[9:11]", f"{s_ear}.vtx[21:25]"]
        cmds.rotate(
            19.0714, 0.0, 0.0,
            ear_vtx_9_11_21_25,
            r=True, os=True, fo=True, p=(0.0, 0.1244, 0.6652)
        )
        cmds.scale(
            1.0, 0.8015, 1.0,
            ear_vtx_9_11_21_25,
            r=True, p=(0.0, 0.1244, 0.6652)
        )
        cmds.move(
            0.0, 0.0482, -0.0738,
            ear_vtx_9_11_21_25,
            r=True, os=True, wd=True
        )
        cmds.rotate(
            -8.2977, 0.0, 0.0,
            ear_vtx_9_11_21_25,
            r=True, os=True, fo=True, p=(0.0, 0.1740, 0.5914)
        )

        # vtx[0:8]
        cmds.rotate(
            39.6308, 0.0, 0.0,
            f"{s_ear}.vtx[0:8]",
            r=True, os=True, fo=True, p=(0.0, 0.1244, 0.9358)
        )
        cmds.scale(
            1.0, 0.6474, 1.0,
            f"{s_ear}.vtx[0:8]",
            r=True, p=(0.0, 0.1244, 0.9358)
        )
        cmds.move(
            0.0, 0.0159, 0.0,
            f"{s_ear}.vtx[0:8]",
            r=True, os=True, wd=True
        )
        cmds.rotate(
            -3.8423, 0.0, 0.0,
            f"{s_ear}.vtx[0:8]",
            r=True, os=True, fo=True, p=(0.0, 0.1404, 0.9358)
        )

        # polySplit #1 (NO selection)
        cmds.polySplit(
            s_ear,
            ch=True, sma=180,
            ep=[
                (22, 0.5000), (45, 0.5000), (37, 0.5000), (38, 0.5000), (39, 0.5000),
                (41, 0.5000), (24, 0.5000), (23, 0.5000), (22, 0.5000)
            ]
        )

        # vtx[26] + vtx[32:33]
        cmds.move(
            0.0, -0.0111, 0.0,
            [f"{s_ear}.vtx[26]", f"{s_ear}.vtx[32:33]"],
            r=True, os=True, wd=True
        )

        # vtx[0:2]
        cmds.move(
            0.0, 0.0160, -0.0007,
            f"{s_ear}.vtx[0:2]",
            r=True, os=True, wd=True
        )

        # vtx[21:23]
        cmds.move(
            0.0, 0.0185, -0.0146,
            f"{s_ear}.vtx[21:23]",
            r=True, os=True, wd=True
        )

        # edges
        ear_edges_1 = [
            f"{s_ear}.e[55]", f"{s_ear}.e[17]", f"{s_ear}.e[20]", f"{s_ear}.e[23]", f"{s_ear}.e[26]",
            f"{s_ear}.e[29]", f"{s_ear}.e[32]", f"{s_ear}.e[35]", f"{s_ear}.e[38]", f"{s_ear}.e[51]"
        ]
        cmds.scale(
            1.0, 1.0912, 1.0912,
            ear_edges_1,
            r=True, p=(0.0, 0.1750, 0.7144)
        )
        cmds.scale(
            1.0, 1.0772, 1.0,
            ear_edges_1,
            r=True, p=(0.0, 0.1750, 0.7144)
        )

        # freeze (you had this here)
        cmds.makeIdentity(s_ear, apply=True, t=1, r=1, s=1, n=0)

        # e[45] + e[41]
        cmds.scale(
            1.3902, 1.0, 1.0,
            [f"{s_ear}.e[45]", f"{s_ear}.e[41]"],
            r=True, p=(0.0, 0.1645, 0.6775)
        )

        # vtx[6] + vtx[8]
        cmds.move(
            0.0, 0.0, -0.0360,
            [f"{s_ear}.vtx[6]", f"{s_ear}.vtx[8]"],
            r=True, os=True, wd=True
        )

        # vtx[7]
        cmds.move(
            0.0007, 0.0268, 0.0259,
            f"{s_ear}.vtx[7]",
            r=True, os=True, wd=True
        )

        # polySplit #2 (NO selection)
        cmds.polySplit(
            s_ear,
            ch=True, sma=180,
            ep=[
                (25, 0.9000), (44, 0.1000), (34, 0.1000), (35, 0.1000), (36, 0.1000),
                (40, 0.1000), (27, 0.9000), (26, 0.9000), (25, 0.9000)
            ]
        )

        # vtx[9:11] + vtx[24:25] + vtx[28:30]
        cmds.move(
            0.0221, 0.0, 0.0,
            [f"{s_ear}.vtx[9:11]", f"{s_ear}.vtx[24:25]", f"{s_ear}.vtx[28:30]"],
            r=True, os=True, wd=True
        )

        # vtx[0:2] + vtx[26:27] + vtx[31:33]
        cmds.move(
            0.0252, 0.0, 0.0,
            [f"{s_ear}.vtx[0:2]", f"{s_ear}.vtx[26:27]", f"{s_ear}.vtx[31:33]"],
            r=True, os=True, wd=True
        )

        # vtx[6:8]
        cmds.rotate(
            0.0, -14.6054, 0.0,
            f"{s_ear}.vtx[6:8]",
            r=True, os=True, fo=True, p=(0.0, 0.2467, 1.0438)
        )
        cmds.move(
            -0.0157, 0.0, 0.0,
            f"{s_ear}.vtx[6:8]",
            r=True, os=True, wd=True
        )

        # vtx[0:11] + vtx[21:33]
        ear_vtx_big = [f"{s_ear}.vtx[0:11]", f"{s_ear}.vtx[21:33]"]
        cmds.rotate(
            11.1988, 0.0, 0.0,
            ear_vtx_big,
            r=True, os=True, fo=True, p=(0.0228, 0.1913, 0.7349)
        )
        cmds.rotate(
            12.4650, 0.0, 0.0,
            ear_vtx_big,
            r=True, os=True, fo=True, p=(0.0228, 0.1388, 0.7316)
        )
        cmds.move(
            0.0, -0.1537, 0.0,
            ear_vtx_big,
            r=True, os=True, wd=True
        )

        # vtx[26] + vtx[32:33]
        cmds.move(
            0.0, -0.0260, -0.0306,
            [f"{s_ear}.vtx[26]", f"{s_ear}.vtx[32:33]"],
            r=True, os=True, wd=True
        )

        # vtx[9:11] + vtx[24]
        cmds.move(
            0.0, 0.0250, 0.0144,
            [f"{s_ear}.vtx[9:11]", f"{s_ear}.vtx[24]"],
            r=True, os=True, wd=True
        )

        # vtx[28:30]
        cmds.move(
            0.0, -0.0240, -0.0194,
            f"{s_ear}.vtx[28:30]",
            r=True, os=True, wd=True
        )

        # smooth / delete hist / assign
        cmds.polySmooth(s_ear, dv=2, bnr=1, ch=False)
        cmds.delete(s_ear, ch=True)
        cmds.hyperShade(assign=f"{PFX}black_face_shader_mat")

        # mirror ear
        s_ear_mirror = cmds.duplicate(s_ear, n= PFX + "s_ear_2")[0]
        cmds.scale(1.0, 1.0, -1.0, s_ear_mirror, r=True)
        cmds.move(0.0, 0.0, 1.17900, s_ear_mirror, r=True, os=True, wd=True)
        cmds.delete(s_ear_mirror, ch=True)

        # group head
        s_head = cmds.group([s_face, s_ear, s_ear_mirror], n=PFX + "s_head")
        cmds.xform(s_head, centerPivots=True)

        # head transform
        cmds.move(-0.6548, 0.0, 0.0, s_head, r=True, os=True, wd=True)
        cmds.rotate(0.0, 0.0, -10.000215, s_head, r=True, os=True, fo=True)
        cmds.scale(1.272827, 1.272827, 1.272827, s_head, r=True)
        cmds.makeIdentity(s_head, apply=True, t=0, r=0, s=1, n=0)
        return s_head

    # HAIR
    def build_hair():
        s_hair_1 = cmds.polySphere(r=1, sx=20, sy=20, ax=(0,1,0), cuv=2, ch=True, n=PFX + "s_hair_1")[0]
        set_trs(s_hair_1, t=(-0.635, 0.292, -0.300), s=(0.25, 0.21, 0.303))
        cmds.delete(s_hair_1, ch=True)
        cmds.hyperShade(assign=f"{PFX}sheep_furr_shader_mat")

        s_hair_2 = cmds.polySphere(r=1, sx=20, sy=20, ax=(0,1,0), cuv=2, ch=True, n=PFX + "s_hair_2")[0]
        set_trs(s_hair_2, t=(-0.635, 0.453, 0.034), s=(0.3, 0.32, 0.395))
        cmds.delete(s_hair_2, ch=True)
        cmds.hyperShade(assign=f"{PFX}sheep_furr_shader_mat")

        s_hair_3 = cmds.polySphere(r=1, sx=20, sy=20, ax=(0,1,0), cuv=2, ch=True, n=PFX + "s_hair_3")[0]
        set_trs(s_hair_3, t=(-0.635, 0.338, 0.277), s=(0.23, 0.2, 0.241))
        cmds.delete(s_hair_3, ch=True)
        cmds.hyperShade(assign=f"{PFX}sheep_furr_shader_mat")

        s_hair = cmds.group([s_hair_1, s_hair_2, s_hair_3], n=PFX + "s_hair"
)
        cmds.xform(s_hair, centerPivots=True)
        return s_hair

    # LEGS
    def build_legs():
        s_leg_1= cmds.polyCone(n=PFX + "s_leg_1", r=1, h=2, sx=20, sy=5, sz=1, ax=(0, 1, 0), cuv=3, ch=True)[0]

        cmds.setAttr(s_leg_1 + ".translateX", -0.185)
        cmds.setAttr(s_leg_1 + ".translateY", -0.8)
        cmds.setAttr(s_leg_1 + ".translateZ", 0.585)

        cmds.setAttr(s_leg_1 + ".rotateX", 31)
        cmds.setAttr(s_leg_1 + ".rotateY", 9)
        cmds.setAttr(s_leg_1 + ".rotateZ", 171)

        cmds.setAttr(s_leg_1 + ".scaleX", 0.109)
        cmds.setAttr(s_leg_1 + ".scaleY", 0.18)
        cmds.setAttr(s_leg_1 + ".scaleZ", 0.109)
        cmds.makeIdentity(s_leg_1, apply=True, t=1, r=1, s=1, n=0)

        # vertex edits
        # vtx[101]
        cmds.move(
            0.0, -0.0650, 0.0,
            f"{s_leg_1}.vtx[101]",
            r=True, os=True, wd=True
        )

        # vtx[80:99] + vtx[101]
        cmds.move(
            0.0, -0.0497, 0.0,
            [f"{s_leg_1}.vtx[80:99]", f"{s_leg_1}.vtx[101]"],
            r=True, os=True, wd=True
        )

        # vtx[60:99] + vtx[101]
        cmds.move(
            0.0, -0.0222, 0.0,
            [f"{s_leg_1}.vtx[60:99]", f"{s_leg_1}.vtx[101]"],
            r=True, os=True, wd=True
        )

        cmds.polySmooth(s_leg_1, dv=1, ch=True)
        cmds.delete(s_leg_1, ch=True)
        cmds.hyperShade(assign=f"{PFX}black_face_shader_mat")

        s_leg_2 = cmds.duplicate(s_leg_1, n=PFX + "s_leg_2")[0]
        cmds.setAttr(s_leg_2 + ".translateX", 1.1)
        cmds.setAttr(s_leg_2 + ".rotateZ", 215)
        cmds.delete(s_leg_2, ch=True)

        s_leg_3 = cmds.duplicate(s_leg_1, n=PFX + "s_leg_3")[0]
        cmds.setAttr(s_leg_3 + ".translateZ", -0.585)
        cmds.setAttr(s_leg_3 + ".rotateX", -31)
        cmds.delete(s_leg_3, ch=True)

        s_leg_4 = cmds.duplicate(s_leg_1, n=PFX + "s_leg_4")[0]
        cmds.setAttr(s_leg_4 + ".translateX", 1.1)
        cmds.setAttr(s_leg_4 + ".translateZ", -0.585)
        cmds.setAttr(s_leg_4 + ".rotateX", -31)
        cmds.setAttr(s_leg_4 + ".rotateZ", 215)
        cmds.delete(s_leg_4, ch=True)

        s_legs = cmds.group([s_leg_1, s_leg_2, s_leg_3, s_leg_4], n=PFX + "s_legs")
        cmds.xform(s_legs, centerPivots=True)
        return s_legs

    # BOARD
    def build_board(body_group):
        # create 5 small boards then group
        tops = []
        for i in range(5):

            t = cmds.polyCube(n=f"{PFX}board_{i+1}", w=0.1, h=0.1, d=2.4)[0]
            cmds.move(-2 + i * 0.11, 0, 0, t)
            cmds.delete(t, ch=True)
            cmds.hyperShade(assign=f"{PFX}wood_shader_mat")
            tops.append(t)

        board = cmds.group(tops, n=PFX + "board")

        PAD = 0.8
        # body bbox
        bb = cmds.exactWorldBoundingBox(body_group)
        # get the demension of the whole group
        sx_min, sy_min, sz_min, sx_max, sy_max, sz_max = bb
        # get the center point
        s_cx = (sx_min + sx_max) * 0.5
        s_cz = (sz_min + sz_max) * 0.5
        s_wx = (sx_max - sx_min)

        # board bbox
        bb2 = cmds.exactWorldBoundingBox(board)
        bx_min, by_min, bz_min, bx_max, by_max, bz_max = bb2
        b_cx = (bx_min + bx_max) * 0.5
        b_cz = (bz_min + bz_max) * 0.5
        b_wx = (bx_max - bx_min)

        # scale X width
        if b_wx > 0.0000001:
            cmds.scale((s_wx * PAD) / b_wx, 1.0, 1.0, board, r=True, ws=True)

        # align center X/Z
        bb2 = cmds.exactWorldBoundingBox(board)
        bx_min, by_min, bz_min, bx_max, by_max, bz_max = bb2
        b_cx = (bx_min + bx_max) * 0.5
        b_cz = (bz_min + bz_max) * 0.5
        cmds.move(s_cx - b_cx, 0.0, s_cz - b_cz, board, r=True, ws=True)

        # stick to bottom (board top = body bottom) + offset
        bb2 = cmds.exactWorldBoundingBox(board)
        by_max = bb2[4]
        deltaY = sy_min - by_max + 0.28
        cmds.move(0.0, deltaY, 0.0, board, r=True, ws=True)

        cmds.xform(board, centerPivots=True)
        return board

    # ARMS
    def build_arms():
        s_arm = cmds.polyTorus(n=PFX + "s_arm_1", r=1, sr=0.3, sx=20, sy=20, ax=(0, 1, 0), ch=True)[0]
        cmds.rotate(0, 0, 90, s_arm)
        cmds.scale(0.119, 0.119, 0.119, s_arm)
        cmds.move(0.3, -0.888, 1.164, s_arm)
        cmds.delete(s_arm, ch=True)
        cmds.hyperShade(assign=f"{PFX}metal_shader_mat")

        s_arm_2 = cmds.duplicate(s_arm, n=PFX + "s_arm_2")[0]
        cmds.move(0, 0, -2.35, s_arm_2, r=True, os=True, wd=True)
        cmds.delete(s_arm_2, ch=True)
        cmds.hyperShade(assign=f"{PFX}metal_shader_mat")

        s_line = cmds.polyCylinder(n=PFX + "s_line_1", r=1, h=2, sx=20, sy=1, sz=1, ax=(0, 1, 0), cuv=3, ch=True)[0]
        cmds.move(0.3, 2.892, 3.319, s_line)
        cmds.scale(0.016, 4.233, 0.016, s_line)
        cmds.delete(s_line, ch=True)
        cmds.hyperShade(assign=f"{PFX}rope_shader_mat")

        s_line2 = cmds.duplicate(s_line, n=PFX + "s_line_2")[0]
        cmds.rotate(29.387, 0, 0, s_line)
        cmds.rotate(-29.387, 0, 0, s_line2)
        cmds.setAttr(s_line2 + ".translateZ", -3.319)
        cmds.delete(s_line2, ch=True)
        cmds.hyperShade(assign=f"{PFX}rope_shader_mat")

        s_arms = PFX + "s_arms"
        s_arms = cmds.group([s_arm, s_arm_2, s_line, s_line2], n=s_arms)
        cmds.xform(s_arms, centerPivots=True)
        return s_arms
    
    if single == False:
        # ----------------------------
        # Build all parts
        # ----------------------------
        s_body = build_body()
        s_head = build_head()
        s_hair = build_hair()
        s_legs = build_legs()
        board  = build_board(s_body)
        s_arms = build_arms()

        # ----------------------------
        # Final group
        # ----------------------------
        sheep_grp = cmds.group([s_body, s_head, s_hair, s_legs, s_arms, board], n=PFX + name)
        # set pivot!
        cmds.setAttr(f"{sheep_grp}.rotatePivotY", 6.6)

        # scale then move
        cmds.scale(size, size, size, sheep_grp, r=True)
        cmds.move(posX, posY, posZ, sheep_grp, ws=True)
        if reverse == True:
            cmds.scale(-size, size, size, sheep_grp, r=True)
        
        return sheep_grp
    
    elif single == True:
        # ----------------------------
        # Build all parts without rope
        # ----------------------------
        s_body = build_body()
        s_head = build_head()
        s_hair = build_hair()
        s_legs = build_legs()
        # ----------------------------
        # Final group
        # ----------------------------
        sheep_grp = cmds.group([s_body, s_head, s_hair, s_legs], n=PFX + name)
        # set pivot!

        # scale then move
        cmds.scale(size, size, size, sheep_grp, r=True)
        cmds.move(posX, posY, posZ, sheep_grp, ws=True)
        if reverse == True:
            cmds.scale(-size, size, size, sheep_grp, r=True)
        
        return sheep_grp

#####################
# make background

def build_frame(x=0, y=0, z=0, size=1.0, mirror_offset_z=11.0):
    # top  
    frame_top = cmds.polyCube(n=PFX+"frame_top", w=1, h=1, d=1, sx=40, sy=4, sz=4, ax=(0,1,0), cuv=4, ch=True)[0]
    cmds.setAttr(frame_top+".translate", 0,6.4,5.4, type="double3")
    cmds.scale(16.689698,1,0.311111, frame_top, r=True, ws=True)
    cmds.polySmooth(frame_top,dv=1,ch=False)
    cmds.delete(frame_top,ch=True)
    cmds.hyperShade(assign=f"{PFX}wood_shader_mat")

    # leg 
    frame_leg_1 = cmds.polyCube(n=PFX+"frame_leg_1", w=1, h=1, d=1, sx=4, sy=20, sz=4, ax=(0,1,0), cuv=4, ch=True)[0]
    cmds.setAttr(frame_leg_1+".translate", 7.2,1.7,5.6, type="double3")
    cmds.scale(1,12,0.311111, frame_leg_1, r=True, ws=True)
    cmds.polySmooth(frame_leg_1,dv=1,ch=False)
    cmds.delete(frame_leg_1,ch=True)
    cmds.hyperShade(assign=f"{PFX}wood_shader_mat")

    frame_leg_2 = cmds.polyCube(n=PFX+"frame_leg_2", w=1, h=1, d=1, sx=4, sy=20, sz=4, ax=(0,1,0), cuv=4, ch=True)[0]
    cmds.setAttr(frame_leg_2+".translate", -7.2,1.7,5.6, type="double3")
    cmds.scale(1,12,0.311111, frame_leg_2, r=True, ws=True)
    cmds.polySmooth(frame_leg_2,dv=1,ch=False)
    cmds.delete(frame_leg_2,ch=True)
    cmds.hyperShade(assign=f"{PFX}wood_shader_mat")

    # lines 
    line_ring_lst=[]
    for j in range(6):
        for i in range(3):
            line_ring=cmds.polyCube(n=f"{PFX}ling_ring_j{j}_i{i}", w=1, h=1, d=1, sx=2, sy=8, sz=4, ax=(0,1,0), cuv=4, ch=True)[0]
            cmds.setAttr(line_ring+".translate", 6.25-j*2.4+i*0.05,6.4,5.4, type="double3")
            cmds.scale(0.06,1.1,0.40, line_ring, r=True, ws=True)
            cmds.polySmooth(line_ring,dv=1,ch=False); 
            cmds.delete(line_ring,ch=True)
            cmds.hyperShade(assign=f"{PFX}rope_shader_mat")
            line_ring_lst.append(line_ring)
    line_ring_group=cmds.group(line_ring_lst, n=PFX+"line_ring_group")

    line_cross=[]
    for l in range(2):
        b=1 if l==0 else -1
        for j in range(2):
            a=1 if j==0 else -1
            for i in range(3):
                ring_blind=cmds.polyCube(n=f"{PFX}ling_ring_l{l}_j{j}_i{i}", w=1, h=1, d=1, sx=2, sy=8, sz=8, ax=(0,1,0), cuv=4, ch=True)[0]
                cmds.setAttr(ring_blind+".translate", 7.2*b,6.35+i*0.05,5.5, type="double3")
                cmds.scale(0.06,1.55,0.6+0.03*a, ring_blind, r=True, ws=True)
                cmds.setAttr(ring_blind+".rotateZ",42*a)
                cmds.polySmooth(ring_blind,dv=1,ch=False); 
                cmds.delete(ring_blind,ch=True)
                cmds.hyperShade(assign=f"{PFX}rope_shader_mat")
                line_cross.append(ring_blind)
    line_cross_group=cmds.group(line_cross, n=PFX+"line_cross")

    frame_group_1=cmds.group([frame_top,frame_leg_1,frame_leg_2,line_ring_group,line_cross_group], n=PFX+"frame_group_1")

    frame_group_2=cmds.duplicate(frame_group_1, n=PFX+"frame_group_2")[0]
    cmds.scale(1,1,-1, frame_group_2, r=True)
    cmds.move(0,0,-mirror_offset_z, frame_group_2, r=True)

    master=cmds.group([frame_group_1,frame_group_2], n=PFX+"frame_all")
    cmds.scale(size,size,size, master, r=True)
    cmds.setAttr(master+".translate", x,y,z, type="double3")

    return master

def build_all_grass(size_mult=1.0):

    sphere_data = [
        (0,-35.68, 0, 100,0.32),
        (8.151,-4, -8, 3,0.4),
        (-10,-4.505, 6.559, 4.088,0.8),
        (-12.628,-5, -16.209, 8,0.4),
        (-34.528,-7.704, -20.397,12,0.6),
        (-56.484,-7.704, -89.528, 40,0.8),
        (-150,-18, -42, 60,0.7),
        (-1, -6.738, -30, 8,0.8),
        (4.695,  -7.704, -65.928, 20,0.7),
        (-50,-7, -3,12,0.6)
    ]

    created=[]
    for i,(tx,ty,tz,s,ys) in enumerate(sphere_data, start=1):
        sp=cmds.polySphere(n=f"{PFX}grass_{i}", r=1, sx=20, sy=20)[0]
        cmds.setAttr(sp+".translate", tx,ty,tz, type="double3")
        cmds.scale(s*size_mult, s*size_mult*ys, s*size_mult, sp, r=True)
        cmds.polySmooth(sp,dv=2,ch=False); 
        cmds.delete(sp,ch=True)
        if i == 1:
            cmds.hyperShade(assign=f"{PFX}green_grass_shader_mat")
        else:
            cmds.hyperShade(assign=f"{PFX}sheep_furr_shader_mat")
        created.append(sp)

    group=cmds.group(created, n=PFX + "grass_group")
    return group

######################## 
# make shaders
def make_noise_shader():
    # in case wrong name

    for tile in tile_palette_dict.keys():
        palette = tile_palette_dict[tile]   # [(r,g,b), (r,g,b), ...]

        shader_name = f"{PFX}{tile}_shader"
        # make a shader
        sh = cmds.shadingNode("aiStandardSurface", asShader=True, n=shader_name+"_mat")
        # create a shading group
        sg = cmds.sets(renderable=True, noSurfaceShader=True, empty=True, n=shader_name+"_SG")

        cmds.connectAttr(sh+".outColor", sg+".surfaceShader", f=True)

        # use noise and ramp to create texture
        noise = cmds.shadingNode("aiNoise", asTexture=True, n=shader_name+"_noise")
        ramp = cmds.shadingNode("ramp", asTexture=True, n=shader_name+"_ramp")

        cmds.setAttr(noise+".scale", 20,10,10, type="double3")
        # how detailed
        cmds.setAttr(noise+".octaves", 4)
        cmds.setAttr(noise+".distortion", 0.2)

        # assign color
        cmds.setAttr(ramp+".type", 0)

        for i, rgb in enumerate(palette):
            r,g,b = rgb
            cmds.setAttr(f"{ramp}.colorEntryList[{i}].color", r,g,b, type="float3")
            cmds.setAttr(f"{ramp}.colorEntryList[{i}].position", i/(len(palette)-1))

        # noise red channel + ramp position
        cmds.connectAttr(noise+".outColorR", ramp+".vCoord", f=True)
        # put ramp color to base color
        cmds.connectAttr(ramp+".outColor", sh+".baseColor", f=True)

        # specular
        cmds.setAttr(sh+".specular", 0.1)
        cmds.setAttr(sh+".specularRoughness", 0.9)

def make_wood_shader():
    shader_name=f"{PFX}wood_shader"
    sh=cmds.shadingNode("aiStandardSurface", asShader=True, n=shader_name+"_mat")
    sg=cmds.sets(renderable=True, noSurfaceShader=True, empty=True, n=shader_name+"_SG")
    cmds.connectAttr(sh+".outColor", sg+".surfaceShader", f=True)

    noise=cmds.shadingNode("aiNoise", asTexture=True, n=shader_name+"_noise")
    ramp=cmds.shadingNode("ramp", asTexture=True, n=shader_name+"_ramp")
    # make a bump
    bump=cmds.shadingNode("aiBump2d", asUtility=True, n=shader_name+"_bump")

    cmds.setAttr(noise+".scale", 5,1.5,5, type="double3")
    cmds.setAttr(noise+".octaves", 6)
    cmds.setAttr(noise+".distortion", 0.45)

    cmds.setAttr(ramp+".type", 0)
    cmds.setAttr(ramp+".colorEntryList[0].color", 0.35,0.22,0.14, type="float3")
    cmds.setAttr(ramp+".colorEntryList[0].position", 0.0)
    cmds.setAttr(ramp+".colorEntryList[1].color", 0.62,0.42,0.25, type="float3")
    cmds.setAttr(ramp+".colorEntryList[1].position", 1.0)

    cmds.connectAttr(noise+".outColorR", ramp+".vCoord", f=True)
    cmds.connectAttr(ramp+".outColor", sh+".baseColor", f=True)

    # use noise to create bump
    cmds.connectAttr(noise+".outColorR", bump+".bumpMap", f=True)
    cmds.setAttr(bump+".bumpHeight", 0.1)
    cmds.connectAttr(bump+".outValue", sh+".normalCamera", f=True)

    cmds.setAttr(sh+".specular", 0.35)
    cmds.setAttr(sh+".specularRoughness", 0.55)

def make_metal_shader():
    shader_name=f"{PFX}metal_shader"
    sh=cmds.shadingNode("aiStandardSurface", asShader=True, n=shader_name+"_mat")
    sg=cmds.sets(renderable=True, noSurfaceShader=True, empty=True, n=shader_name+"_SG")
    cmds.connectAttr(sh+".outColor", sg+".surfaceShader", f=True)

    cmds.setAttr(sh+".base", 1)
    cmds.setAttr(sh+".baseColor", 0.6,0.6,0.62, type="double3")
    cmds.setAttr(sh+".metalness", 1)
    cmds.setAttr(sh+".specular", 1)
    cmds.setAttr(sh+".specularRoughness", 0.3)
    cmds.setAttr(sh+".specularAnisotropy", 0.6)
    cmds.setAttr(sh+".specularRotation", 0.15)

    noise=cmds.shadingNode("aiNoise", asTexture=True, n=shader_name+"_noise")
    cmds.setAttr(noise+".scale", 120,8,120, type="double3")
    cmds.setAttr(noise+".octaves", 3)
    cmds.setAttr(noise+".distortion", 0.1)

###########################
# light
def make_light(index=0, radius=5000, exposure=1.0):
    # ===== HDRI SKY SPHERE =====
    full_path = os.path.join(file_path, file_names[index])
    sky = cmds.polySphere(n=f"{PFX}skySphere", r=radius, sx=64, sy=32)[0]
    # flip normals inward
    cmds.polyNormal(sky, normalMode=0, userNormalMode=0, ch=False)

    # create shader
    sh = cmds.shadingNode("aiStandardSurface", asShader=True, n=f"{PFX}sky_mat")
    sg = cmds.sets(renderable=True, noSurfaceShader=True, empty=True, n=f"{PFX}sky_SG")
    cmds.connectAttr(sh + ".outColor", sg + ".surfaceShader", f=True)

    img = cmds.shadingNode("aiImage", asTexture=True, n=f"{PFX}sky_img")
    cmds.setAttr(img + ".filename", full_path, type="string")

    # emission make color
    cmds.setAttr(sh + ".base", 0)
    cmds.setAttr(sh + ".emission", 5)
    cmds.setAttr(sh+".emissionColor", 1,1,1, type="double3") 
    cmds.connectAttr(img+".outColor", sh+".emissionColor", f=True)

    cmds.sets(sky, e=True, forceElement=sg)

    # ===== DIRECTIONAL LIGHT =====
    light = cmds.directionalLight(n=f"{PFX}dirLight")
    light_transform = cmds.listRelatives(light, parent=True)[0]
    # rotation from your screenshot
    cmds.setAttr(light_transform + ".rotateX", -11.5)
    cmds.setAttr(light_transform + ".rotateY", -235.736)
    cmds.setAttr(light_transform + ".rotateZ", 10.849)
    # ===== ARNOLD SETTINGS =====
    cmds.setAttr(light + ".aiUseColorTemperature", 1)
    cmds.setAttr(light + ".aiColorTemperature", 5873)
    cmds.setAttr(light + ".aiExposure",4)
    cmds.setAttr(light + ".aiSamples", 1)
    cmds.setAttr(light + ".aiNormalize", 1)
    # cast shadows
    cmds.setAttr(light + ".aiCastShadows", 1)

    return sky, sh, sg, img, light_transform, light

###############################
# camera 
def setCamera():
    # Create camera for the scene
    camera = cmds.camera(name=PFX + 'myRenderCam')[0]

    # Start pose
    cmds.currentTime(s, edit=True)
    cmds.move(16.5, -0.7, 16.5, camera, absolute=True)
    cmds.rotate(2.8, 400, 0, camera, absolute=True)
    cmds.setAttr(f"{camera}.focalLength", 35)

    # key start
    cmds.setKeyframe(camera, at=["translateX","translateY","translateZ","rotateX","rotateY","rotateZ"])

    # Mid pose
    cmds.currentTime(n/2, edit=True)
    cmds.move(17.7, 0.9, 10.25, camera, absolute=True)
    cmds.rotate(-1.4, 410, 0, camera, absolute=True)

    cmds.setKeyframe(camera, at=["translateX","translateY","translateZ","rotateX","rotateY","rotateZ"])

    # End pose
    cmds.currentTime(n, edit=True)
    cmds.move(16.5, -0.7, 16.5, camera, absolute=True)
    cmds.rotate(2.8, 400, 0, camera, absolute=True)

    # key end
    cmds.setKeyframe(camera, at=["translateX","translateY","translateZ","rotateX","rotateY","rotateZ"])

    # Make motion smooth
    # itt="auto"  in tangent type (how the motion enters a keyframe)
    # ott="auto"  out tangent type (how the motion leaves a keyframe)
    cmds.keyTangent(camera, at=["translateX","translateY","translateZ", "rotateX","rotateY","rotateZ"], itt="auto", ott="auto")

    # Disable renderability for all cameras except the one we want to render from
    all_cameras = cmds.ls(type='camera')
    for cam in all_cameras:
        cmds.setAttr(f'{cam}.renderable', 0)
    
    # Enable only the desired camera
    cmds.setAttr(f'{camera}.renderable', 1)
    cmds.optionVar(intValue=('renderSequenceAllCameras', 1))


    return camera

###############################
# render
def setRenderSettings():
    # # Initialize Arnold render settings for a fresh scene
    ai.core.createOptions()

    # change the path to maya can read
    # "defaultRenderGlobals.imageFilePrefix" - path + pfx
    prefix = os.path.join(out_path, "myTestRender").replace("\\", "/")
    cmds.setAttr("defaultRenderGlobals.imageFilePrefix", prefix, type="string")

    # Set image format for both Maya and Arnold to ensure correct output
    cmds.setAttr("defaultRenderGlobals.imageFormat", 51)  # Set Maya image format to "Custom image format"
    cmds.setAttr("defaultArnoldDriver.aiTranslator", "exr", type="string") # Also set Arnold driver to output EXR

    # Turn on animation and set frame range
    cmds.setAttr("defaultRenderGlobals.animation", 1)
    cmds.setAttr("defaultRenderGlobals.startFrame", s)
    cmds.setAttr("defaultRenderGlobals.endFrame", n)
    cmds.setAttr("defaultRenderGlobals.byFrameStep", 1)

    # Set resolution and aspect ratio
    cmds.setAttr("defaultResolution.width", 1920)
    cmds.setAttr("defaultResolution.height", 1080)
    cmds.setAttr("defaultResolution.deviceAspectRatio", float(1920)/1080)

    # Set file naming convention to myTestRender.0001.exr
    cmds.setAttr("defaultRenderGlobals.extensionPadding", 4) # Number of digits in frame number padding, 4 is industry standard
    cmds.setAttr("defaultRenderGlobals.useFrameExt", 1) # Use frame extension (myTestRender.0001.exr instead of myTestRender.exr)
    cmds.setAttr("defaultRenderGlobals.periodInExt", 1) # Use a period before the frame number in the file name (myTestRender.0001.exr instead of myTestRender0001.exr)
    cmds.setAttr("defaultRenderGlobals.putFrameBeforeExt", 1) # Put frame number before file extension (myTestRender.0001.exr instead of myTestRender.exr.0001)

    # Set some additional Arnold settings, such as sampling, if you want
    cmds.setAttr("defaultArnoldRenderOptions.GISpecularSamples", 2)
    cmds.setAttr("defaultArnoldRenderOptions.GISpecularDepth", 2)
    cmds.setAttr("defaultArnoldDriver.mergeAOVs", 1)

def renderScene():
    # Render the scene using Arnold
    cmds.RenderSequence()


def main():
    cleanup_scene()

    sky, sky_shd, sky_sg, sky_img, dir_light_transform, dir_light_shape = make_light(0, radius=5000, exposure=15.0)
    make_noise_shader()
    make_wood_shader()
    make_metal_shader()

    sheep_single_1 = build_sheep(5.5,-3, 4.5, 1, "sheep_single_1",True,True)
    cmds.setAttr(sheep_single_1 + ".rotate", 0, 60, 16, type="double3")

    sheep_single_2 = build_sheep(-0.5,-3.5, -15, 1, "sheep_single_2",True,True)
    cmds.setAttr(sheep_single_2 + ".rotate", 0, -40, 0, type="double3")

    sheep_single_3 = build_sheep(-18,-3.5, -2, 1, "sheep_single_3",True,True)
    cmds.setAttr(sheep_single_3 + ".rotate", 0, -22, 0, type="double3")

    sheep_single_4 = build_sheep(-12,-1.7, 5, 1, "sheep_single_4",True,True)
    cmds.setAttr(sheep_single_4 + ".rotate", 0, 0, 23, type="double3")

    sheep_single_5 = build_sheep(4.3,-3, 8.4, 1, "sheep_single_5",True,True)
    cmds.setAttr(sheep_single_5 + ".rotate", 0, -34, 15, type="double3")

    frame = build_frame( x=0, y=0, z=0, size=1)
    grass_group = build_all_grass()    
    
    sheep1 = build_sheep(-1.2, 0, 0, 1.0, "sheep_1",False)
    sheep2 = build_sheep(-3.6, 0, 0, 1.0, "sheep_2",False)
    sheep3 = build_sheep(-6.0, 0, 0, 1.0, "sheep_3",False)
    sheep4 = build_sheep(1.2, 0, 0, 1.0, "sheep_4",True)
    sheep5 = build_sheep(3.6, 0, 0, 1.0, "sheep_5",True)
    sheep6 = build_sheep(6.0, 0, 0, 1.0, "sheep_6",True)


    # OUTER SHEEP
    cmds.expression(object = f"{PFX}sheep_6", s = f"{PFX}sheep_6.rotateZ = clamp(0,40,sin(2*{PI}*frame/{n}) * 40)")
    cmds.expression(object = f"{PFX}sheep_3", s = f"{PFX}sheep_3.rotateZ = clamp(-40,0,sin(2*{PI}*frame/{n}) * 40)")

    #INNER SHEEP
    cmds.expression(object = f"{PFX}sheep_5", s = f"{PFX}sheep_5.rotateZ = clamp(0,15,sin(2*{PI}*frame/{n}) * 15)")
    cmds.expression(object = f"{PFX}sheep_2", s = f"{PFX}sheep_2.rotateZ = clamp(-15,0,sin(2*{PI}*frame/{n})* 15)")

    #INNERERER SHEEP
    cmds.expression(object = f"{PFX}sheep_4", s = f"{PFX}sheep_4.rotateZ = clamp(0,10,sin(2*{PI}*frame/{n}) * 5)")
    cmds.expression(object = f"{PFX}sheep_1", s = f"{PFX}sheep_1.rotateZ = clamp(-10,0,sin(2*{PI}*frame/{n}) * 5)")

    # decoration sheeps
    cmds.expression(object = f"{PFX}sheep_single_1", s = f"{PFX}sheep_single_1.rotateY = 90 - sin(2*{PI}*frame/{n})* 20")
    cmds.expression(object = f"{PFX}sheep_single_2", s = f"{PFX}sheep_single_2.translateY = abs(sin(2*{PI}*frame/{n}) * 2)-3.5")
    cmds.expression(object = f"{PFX}sheep_single_3", s = f"{PFX}sheep_single_3.translateY = abs(sin(2*{PI}*frame/{n}*2) * 2.5)-3.5")
    cmds.expression(object = f"{PFX}sheep_single_5", s = f"{PFX}sheep_single_5.rotateZ = sin(2*{PI}*frame/{n})*20 + 10")

    # Master grouping
    master_grp = cmds.group([frame,
        grass_group,
        sheep1, sheep2, sheep3, sheep4, sheep5, sheep6,
        sheep_single_1, sheep_single_2, sheep_single_3, sheep_single_4, sheep_single_5,
        sky,
        dir_light_transform], n=f"{PFX}MASTER_GRP")

    camera = setCamera()
    setRenderSettings()
    renderScene()

    #test render camera
    cams = cmds.ls(type="camera")
    print("Renderable cameras:")
    for c in cams:
        if cmds.getAttr(c + ".renderable"):
            print("  ", c)

main()

