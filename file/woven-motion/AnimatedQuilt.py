#######################################
# assignment_2_2.py
# Animated Pixel Art Quilt
# by Lu Zhang
# Date Created: 2026-02-19
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
import os

#prefix
PFX = "LZ_"
tileSize = 30
cols = 5
rows = 5

file_path = r"D:\work_scad\vfx705\assignment_1&2\p_02\WI26_VFX705_02_Lu_Zhang_P02_AnimatedQuilt_FINAL_v01"
file_names = [
    r"olive.c",
    r"clew.c",
    r"sissor.c",
    r"laurel.c",
    r"wheel.c"
]
def read_file(full_path):
    #get from files
    frame_count = 0
    width = 0
    height = 0

    # Collect all hex values
    all_hex_values = []

    with open(full_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            # Check for #define lines
            if line.startswith("#define"):
                parts = line.split()#turn this line into list
                if len(parts) >= 3:
                    define_name = parts[1]
                    define_value = parts[2]

                    if "FRAME_COUNT" in define_name:
                        frame_count = int(define_value)

                    elif "FRAME_WIDTH" in define_name:
                        width = int(define_value)

                    elif "FRAME_HEIGHT" in define_name:
                        height = int(define_value)

            # Check for hex color values
            elif "0x" in line:
                parts = line.split(",")

                for part in parts:
                    part = part.strip()
                    #keep every hex color in this all_hex_value list
                    if part.startswith("0x"):
                        all_hex_values.append(part)

    #get the amout of pixels in one frame and in one file
    pixels_per_frame = width * height
    total_pixel_per_file = pixels_per_frame * frame_count
    frames = []
    for i in range(frame_count):
        start = i * pixels_per_frame
        end = start + pixels_per_frame
        frames.append(all_hex_values[start:end])

    return frame_count, width, height, frames

    #make a dictionary to keep the tile names as keys and list of hex color
whole_dict = {}

for curr_file in file_names:
    full_path = os.path.join(file_path, curr_file)
    #delete the ".c"
    name = curr_file.replace(".c", "")
    #how many pixels in one file
    fcount, w, h, frames = read_file(full_path)

    whole_dict[name] = frames

# print(whole_dict.keys())
print(whole_dict["clew"][1])
# whole_dict = {
#   "clew":[.....],[.....],[.....],[.....],[......],
#   "laurel":[.....],[.....],[.....],[.....],[......],
#   "olive":[.....],[.....],[.....],[.....],[......],
#   "sissor":[.....],[.....],[.....],[.....],[......],
#   "wheel":[.....],[.....],[.....],[.....],[......]}

def hex_to_rgb(hex_color):

    red_hex = hex_color[8:10]
    blue_hex = hex_color[4:6]
    green_hex = hex_color[6:8]

    red_int = int(red_hex,16)
    blue_int = int(blue_hex,16)
    green_int = int(green_hex,16)

    #normalize
    red_float = round(red_int / 255.0, 2)#round(a,b) keep b decimal places of a
    green_float = round(green_int/255.0, 2)
    blue_float = round(blue_int / 255.0, 2)

    return red_float, green_float, blue_float

#########################################

tile_palette_dict = {}        # tile -> [ (r,g,b), (r,g,b), ... ]
tile_frames_dict = {}   # tile -> [ frame0_idx_list, frame1_idx_list, ... ]

#make a dictionary to keep name as keys, list of frame and change hex color into num
for tile in whole_dict:
    frames = whole_dict[tile]#"clew"

    # map: rgb tuple -> palette index
    seen = set()#faster than dictionary
    color_to_index = {}
    palette = []
    indexed_frames = []

    for frame in frames:
        frame_indices = []

        for hx in frame:
            rgb = hex_to_rgb(hx)  #change hex into rgb

            #save the unique colors to make a color palette
            if rgb not in seen:
                seen.add(rgb)
                #count the len() before append elements, so start with 0 
                color_to_index[rgb] = len(palette)
                #create a color palette
                palette.append(rgb)

            #append the num to the new list
            frame_indices.append(color_to_index[rgb])#frame0 = [0,1,2,0,....]
        #append the frames to the bigger new list
        indexed_frames.append(frame_indices)#[frame0,frame1,......]

    #add palette and frames to the dictionary with the keys
    tile_palette_dict[tile] = palette
    tile_frames_dict[tile] = indexed_frames

#import finish!!

################################

def cleanup_scene():

    if cmds.objExists(f"{PFX}*"):
        cmds.delete(f"{PFX}*")
        cmds.grid(toggle=False)


#make shader
def mk_shader_from_palette():

    for tile in tile_palette_dict.keys():
        palette = tile_palette_dict[tile]   # [(r,g,b), (r,g,b), ...]

        for i, rgb in enumerate(palette):
            r = rgb[0]
            g = rgb[1]
            b = rgb[2]

            shader_name = f"{PFX}{tile}_shader_{i}"

            # skip if shader already exists
            if cmds.objExists(shader_name):
                continue

            # create shader
            cur_shader = cmds.shadingNode("aiFlat", asShader=True, n=shader_name)

            # set shader color
            cmds.setAttr(f"{cur_shader}.color", r, g, b, type="double3")#double3 -- three float(0 - 1)

#visibility function
def set_visibility_keyframes(obj_name, frame_num, total_frames):
    # visible on its own frame
    cmds.setKeyframe(obj_name, attribute="visibility", value=1, time=frame_num)

    #other frames are invisiable by defult
    times = []
    #if it's not the first frame
    if frame_num > 1:
        #the frame before this frame
        times.append(frame_num - 1)
    #if it's not the last frame
    if frame_num < total_frames:
        #the frame after this frame 
        times.append(frame_num + 1)

    #if there is anything in this list
    if times:
        cmds.setKeyframe(obj_name, attribute="visibility", value=0, time=times)



def build_visibility_animation(tile,tile_name):
    name = tile_name
    frames = tile_frames_dict[tile]
     # 6 frames frames=[[...],[...],[...],......]
     #height is the length of the data
    height = int(len(frames[0])**0.5)
    #width is the length of the list in the data(althought it's the same in my tile)
    width = int(len(frames[0])**0.5)
    pixel_size = tileSize / height
    frame_count = len(frames)
    #play from 1st to the last frame 
    cmds.playbackOptions(min=1, max=frame_count)
     # group per tile
    tile_grp = cmds.group(empty=True, n=f"{PFX}{name}_grp")

    for num, frame_indices in enumerate(frames, start=1):#frame_indices=[.....], num -- whick frame
        #group pre frame
        frame_grp = cmds.group(empty=True, n=f"{PFX}{name}_f{num}_grp", parent=tile_grp)
        for i, color_index in enumerate(frame_indices):#every signle one
            row = i // width
            col = i % width
            # create cube for this frame pixel
            # if not cmds.objExists(cube_name):
            cube = cmds.polyCube(name=f"{PFX}{name}_f{num}_r{row}_c{col}", w=pixel_size, h=pixel_size, d=pixel_size)
            cmds.rotate(90, 0, 0, cube)

            # position like mk_tile() + tile offset
            # xPos = x_offset + col * pixel_size
            xPos = (col+0.5) * pixel_size
            yPos = yPos = (height - 1 - row+0.5) * pixel_size
            cmds.move(xPos, yPos, 0, cube)

            cmds.hyperShade(assign=f"{PFX}{tile}_shader_{color_index}")
            cmds.parent(f"{PFX}{name}_f{num}_r{row}_c{col}", frame_grp)


                # keyframes: visible only on its frame
            set_visibility_keyframes(f"{PFX}{name}_f{num}_r{row}_c{col}", num, frame_count)
    return tile_grp


def main():
    cleanup_scene()
    mk_shader_from_palette()

    #whole group
    quilt_grp = cmds.group(empty=True, n=f"{PFX}quilt_grp")
    #make tiles and move to position
    for j in range(rows):
        # print(j)
        for i in range(cols):
            #make tiles in order
            mod_cnt = (i + j) % 5
            # print(i)
            if mod_cnt == 0:
                tile = "olive"
                tile_name = f"olive_r{i}_c{j}"
            elif mod_cnt == 1:
                tile = "sissor"
                tile_name = f"sissor_r{i}_c{j}"
            elif mod_cnt == 2:
                tile = "clew"
                tile_name = f"clew_r{i}_c{j}"
            elif mod_cnt == 3:
                tile = "laurel"
                tile_name = f"laurel_r{i}_c{j}"
            elif mod_cnt == 4:
                tile = "wheel"
                tile_name = f"wheel_r{i}_c{j}"
            
            #make tiles
            cur_grp = build_visibility_animation(tile,tile_name)
            #move the tiles
            # cmds.move(-i*(tileSize),j*(tileSize),0,cur_grp)
            cmds.move(i * (tileSize), -j * (tileSize), 0, cur_grp)
            cmds.parent(cur_grp, quilt_grp)

# build_visibility_animation("olive","1")
#finally run!!!
main()
