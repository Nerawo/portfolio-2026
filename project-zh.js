if (document.documentElement.dataset.lang === "zh") {
  const zhCases = {
    "wired-wings":["以动力装置为原型，将复杂机械结构转化为由几何、约束与解析运动共同驱动的程序化系统。","程序化建模与动画",[["01 · 挑战","将机械运动重构为系统","原作由纸质翼面、钢丝连杆、圆形关节与配重构成。目标是在保留运动特征的同时，让每个重复单元都能程序化生成并参与动画。"],["02 · 控制器","凸轮—从动件机构","持续旋转的凸轮驱动从动臂往复摆动。系统逐帧计算凸轮圆心，并通过 atan2 与 acos 求解从动臂贴合圆周所需的切线角度。"],["03 · 连杆","三角关系的解析求解","翼面连接点与环形关节构成定长三角连杆。驱动点移动时，系统利用余弦定理逐帧求解连接臂在世界空间中的旋转。"],["04 · 成果","可复用的动力组件","Intersection Analysis 在结构旋转时持续提取稳定接触点。最终系统生成同步扇动动画，约含 32.2 万个多边形，单帧渲染约 1.8 分钟。"]]],
    "procedural-building":["以萨凡纳 The Bowery 为参考开发的参数化公寓生成器，可控制建筑体量、楼层、立面模块、屋顶细节与材质。","程序化建模",[["01 · 控制","面向艺术家的建筑参数","宽度、高度、进深、层高、柱间距、窗宽、门宽和阳台高度等核心变量均开放为参数，无需进入节点网络即可调整设计。"],["02 · 生成","单一网络生成多种楼层","通过 foreach 循环沿垂直方向堆叠楼层，并利用迭代索引区分首层、标准层与顶层。"],["03 · 布置","基于规则的立面装配","结合 Line、Delete 与 Copy to Points 布置门窗和立柱；建筑尺寸变化时，各类构件数量会自动重新计算。"],["04 · 材质","由属性驱动的自动分配","组件生成时写入 name 属性，合并后转换为 primitive group，并据此自动分配材质。最终建筑约含 4.7 万个 primitives。"]]],
    "ember-field":["一款面向艺术家的 Maya 工具：采样网格顶点，并以可控随机方式生成模块化篝火、火星与次级元素。","工具开发",[["01 · 系统","基于顶点的散布","工具可采样所选网格的全部顶点或指定比例，并用独立点集分别控制篝火和更高密度的火星分布。"],["02 · 资产构建","模块化程序篝火","每个资产由随机化木柴、多层火焰几何、发光材质与火星等组成；数量、缩放、颜色和扭转均在可控范围内变化。"],["03 · 朝向","一致的空间指向","自定义 aim_to_origin 函数通过临时 locator 与 aim constraint 获取旋转，应用结果后自动清理辅助节点。"],["04 · 界面","可靠的 Maya GUI 流程","界面集中控制密度与选择逻辑。通过规范 UI 回调参数和 get_points 返回值，解决了回调与数据结构错误。"]]],
    "kelp-forest":["融合程序化海带、鱼群模拟、地形、水体体积与氛围照明的高密度水下生态环境。","程序化环境与特效",[["01 · 海带","通过可复用控制塑造有机形态","两组 ramp 控制叶片宽度、收尖、波动与不规则程度；程序化叶片进入 L-system，构建多种海带结构。"],["02 · 分布","环境尺度的形态变化","在 HeightField 上散布点并写入随机变体属性，再通过 Copy to Points 分布五种海带变体。"],["03 · 鱼群","由 POP 驱动的群游运动","粒子经 drag、axis force 与 attribute noise 塑造运动；轨迹转换为曲线后，通过 sweep 构建与运动方向对齐的鱼身和鱼尾。"],["04 · 氛围","用体积与光线建立深度","HeightField 构成地形，VDB fog 形成纵深衰减。最终场景约含 3910 万个多边形与 120 万条曲线。"]]],
    "steam-clock-integration":["完整的实拍 VFX 镜头流程：通过摄影机跟踪、CG 资产、体积特效、分层渲染与合成，将蒸汽钟整合进真实场景。","视觉特效整合",[["01 · 跟踪","建立可靠的虚拟摄影机","在 Nuke 中完成摄影机跟踪并传入三维流程，随后反复校正焦距与透视，使钟体稳定贴合实拍环境。"],["02 · 特效","局部烟雾与环境雾","使用 Houdini Pyro 模拟钟体烟雾并以 VDB 输出至 Maya；另一套 density volume 系统生成环境薄雾。"],["03 · 渲染","为合成保留分层控制","通过 Arnold Render Setup 分离钟体、烟雾、雾、阴影与反射，使各项贡献都能独立调整。"],["04 · 合成","统一光照、材质与透视","在 Nuke 中修正发光透明度、焦距偏差、着色差异和材质颜色，使 CG 元素遵循实拍素材的空间逻辑。"]]],
    "newtons-cradle":["完全由脚本生成的 Maya 场景，整合模块化角色构建、自动对齐、程序化材质与无缝循环动画。","程序化动画",[["01 · 架构","由模块化函数生成场景","身体、头部、支架、灯光、材质、摄影机与渲染设置均由独立 Python 函数构建，再由 main 函数装配完整场景。"],["02 · 对齐","基于包围盒的自动布置","系统读取角色与支撑结构的世界空间 bounding box，根据其范围计算比例与中心位置，无需手动偏移。"],["03 · 动画","数学上连续的无缝循环","正弦表达式在设定帧数内完成一个完整周期，确保结束状态准确回到起始状态。"],["04 · 复用","参数化角色行为","reverse 与 single 参数控制方向和结构变体；Arnold 材质由 Standard Surface、noise 与 ramp 程序化生成。"]]],
    "woven-motion":["读取外部像素动画数据，并将其重构为可扩展、可播放的三维织毯动画。","数据驱动动画",[["01 · 输入","解析外部像素数据","脚本从 .c 文件解析帧数、宽高与十六进制像素值，再按 tile 分组并组织为逐帧字典。"],["02 · 色板","跨帧共享材质","将十六进制颜色标准化为 RGB，并为每个 tile 去重生成共享色板，使所有动画帧复用同一组材质。"],["03 · 重构","从像素到动画几何","脚本为每一帧构建几何，并通过可见性动画还原像素运动；行列参数控制织毯整体排布。"],["04 · 调试","确保完整生成每一帧","早期 return 位于循环内部，导致生成提前停止。将其移至循环外后恢复完整 tile，也理清了系统控制流。"]]],
    "yellowstone":["受黄石国家公园启发的实时电影化景观练习，重点研究地形、自然构图、氛围与灯光。","实时环境制作",[["01 · 环境","建立清晰的荒野构图","通过山体轮廓、水面、植被与前景芦苇的层次关系建立纵深，并引导视线穿过景观。"],["02 · 灯光","实时环境氛围","平衡方向光、天空光、雾与反射，在保持地形可读性的同时营造平静的电影氛围。"],["03 · 输出","由摄影机组织环境展示","最终动画采用经过控制的摄影机路径，将环境呈现为连贯的实时镜头，而非静态场景。"]]],
    "crimson-still-life":["围绕程序化材质、高光响应、电影化灯光与色彩收尾展开的风格化静物练习。","视觉开发",[["01 · 材质","程序化表面开发","使用 VEX 控制高光表现、表面变化以及形体对光线的响应。"],["02 · 灯光","以明暗关系塑造形体","方向性照明与受控的深红色调共同建立主体分离、空间深度和集中的电影氛围。"],["03 · 收尾","在 Nuke 中统一色彩","在 Nuke 中平衡对比度、细化色彩关系并统一整体构图。"]]],
    "cactus-still-life":["结合程序化造型、可控重复、材质响应与展示灯光的风格化仙人掌练习。","程序化建模与材质",[["01 · 形态","模块化的有机主体","重复叶片构成清晰轮廓，并通过缩放与旋转变化避免机械式均匀。"],["02 · 表面","平衡风格化与材质表现","植物与陶盆采用不同的粗糙度、颜色和高光特征，区分有机形体与硬质容器。"],["03 · 展示","紧凑的视觉开发练习","中性灯光与简洁环境将注意力集中在轮廓、材质变化与程序化重复上。"]]],
    "empty-frames":["通过建筑框景、黑暗、选择性照明与合成，营造安静电影空间的氛围练习。","灯光与合成",[["01 · 构图","以建筑形成视觉框架","影院结构将视线引向银幕，重复座椅与墙面细节建立空间尺度与节奏。"],["02 · 灯光","控制可见信息","低调照明只揭示理解环境所需的结构信息，同时保留空旷感与期待感。"],["03 · 合成","最终明暗平衡","在合成阶段调整阴影密度、高光分离度，以及银幕与观众席之间的明暗关系。"]]],
    "when-the-rain-speaks":["一部短纪录片，讲述 Squamish 社群成员 Jason Nahanee 对雨的记忆与情感联系。","前期策划、摄影与后期",[["01 · 前期","组织一场亲密而克制的对话","我负责故事板、镜头设计、采访规划与视觉方向，让影像能够承载人物记忆，又不过度干扰其表达。"],["02 · 拍摄","摄影与现场协调","我参与场景布置、摄影机规划与现场协作，以保持视觉连续性和专注、克制的纪录片语气。"],["03 · 后期","剪辑、蒙太奇与动态图形","通过剪辑与蒙太奇建立最终叙事，并在能够补充语境和情绪节奏的位置加入视觉特效与动态图形。"]]]
  };
  const data = zhCases[document.body.dataset.project];
  if (data) {
    const lede = document.querySelector(".case-lede > p");
    if (lede) lede.textContent = data[0];
    const role = document.querySelector(".case-facts p:first-child span:last-child");
    if (role) role.textContent = data[1];
    document.querySelectorAll(".case-section").forEach((section, i) => {
      const content = data[2][i]; if (!content) return;
      section.querySelector(".case-section-label").textContent = content[0];
      section.querySelector("h2").textContent = content[1];
      const paragraphs = section.querySelectorAll(".case-section-copy > p");
      paragraphs.forEach((p, n) => { p.textContent = n ? "" : content[2]; });
    });
  }
  const labels = document.querySelectorAll(".case-facts p span:first-child");
  ["职责","工具","日期","影片"].forEach((v,i) => { if(labels[i]) labels[i].textContent=v; });
  const eyebrow = document.querySelector(".case-header .eyebrow"); if(eyebrow) eyebrow.textContent=eyebrow.textContent.replace("Case Study","项目拆解");
  const dateMap={"May 2026":"2026年5月","April 2026":"2026年4月","March 2026":"2026年3月","February 2026":"2026年2月","November 2025":"2025年11月","April 2025":"2025年4月"};
  document.querySelectorAll(".case-header .eyebrow, .case-facts p:nth-child(3) span:last-child").forEach(node=>{Object.entries(dateMap).forEach(([en,zh])=>node.textContent=node.textContent.replace(en,zh));});
  const next = document.querySelector(".case-next div > span"); if(next) next.textContent="下一个项目";
  const watch = document.querySelector(".case-facts a"); if(watch) watch.textContent="观看 →";
  if (document.body.dataset.project === "wired-wings") {
    const caption = document.querySelector(".case-inline-media figcaption");
    if (caption) caption.textContent = "最终程序化动力组件";
  }
}
