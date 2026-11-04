// 古籍插图：全部为 Wikimedia Commons 上标注 Public domain 的明清刻本图像。
// 文件名逐个在 Commons API 中核对过（描述文字与物产对应）。页面用的是本地副本
// assets/illustrations/（python tools/fetch_illustrations.py 下载），点图跳 Commons 原页以示出处。
// 键 = data/nanshan.js 中物产的 name；值 = [版本 id, Commons 文件名]，按显示顺序排列。
window.ILLUSTRATIONS = {
  editions: {
    jiang: { name: "蒋应镐绘图本", short: "蒋本", era: "明", credit: "蒋应镐 绘 · 李文孝 刻" },
    hu: { name: "胡文焕《山海经图》", short: "胡本", era: "明", credit: "胡文焕 编（Commons 矢量描摹）" },
    wang: { name: "汪绂《山海经存》", short: "汪本", era: "清", credit: "汪绂 绘（1895 年刊）" }
  },
  products: {
    "祝余": [["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol1b-zhuyu-plant.jpg"]],
    "迷穀": [["wang", "Wang fu(1895)-shanhaijingcun1-fol5amigu-confusionmulberry.png"]],
    "狌狌": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol1b-shengsheng.jpg"],
      ["hu", "南山經-狌狌.svg"],
      ["wang", "Wang fu(1895)-shanhaijingcun1-fol5a-shengsheng.png"]
    ],
    "鹿蜀": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol3b-lushu.jpg"],
      ["hu", "南山經-鹿蜀.svg"],
      ["wang", "Wang fu(1895)-shanhaijingcun1-fol6a-lushu.jpg"]
    ],
    "旋龟": [
      ["hu", "南山經-旋龜.svg"],
      ["wang", "Wang fu(1895)-shanhaijingcun1-fol6b-xuangui-revolvingtortoise.png"]
    ],
    "鯥": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol4a-lu-fish.jpg"],
      ["hu", "南山經-鯥鱼.svg"],
      ["wang", "Wang fu(1895)-shanhaijingcun1-fol6b-lu-fish.png"]
    ],
    "类": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol4a-lei.jpg"],
      ["hu", "南山經-類.svg"]
    ],
    "猼訑": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol5b-boshi.jpg"],
      ["hu", "南山經-猼訑.svg"]
    ],
    "䳋鵂": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol6a-changfu.jpg"],
      ["hu", "南山經-changfu.svg"]
    ],
    "九尾狐": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol5b-ninetailfox.jpg"],
      ["hu", "南山經-九尾狐.svg"]
    ],
    "灌灌": [["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol6a-guanguan.jpg"]],
    "赤鱬": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol6a-chiru.jpg"],
      ["hu", "南山經-赤鱬.svg"]
    ],
    "狸力": [["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol8a-lili-powercat.jpg"]],
    "鴸": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol8a-zhu-bird.jpg"],
      ["hu", "南山經-鴸.svg"]
    ],
    "长右": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol8a-changyou.jpg"],
      ["hu", "南山經-長右.svg"]
    ],
    "猾褢": [
      ["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol7b-huahuai.jpg"],
      ["hu", "南山經-猾褢.svg"]
    ],
    "彘": [["hu", "南山經-彘.svg"]],
    "䍺": [["hu", "南山經-䍺.svg"]],
    "蛊雕": [["hu", "南山經-蠱雕.svg"]],
    "瞿如": [["hu", "南山經-瞿如.svg"]],
    "凤皇": [["hu", "南山經-鳳凰.svg"]],
    "颙": [["hu", "南山經-顒.svg"]]
  },
  // 山系山神
  gods: {
    nan1: [["jiang", "Shahaijing-chongzhen(1628–1644)-nanshanjing1-fol7b-shen-mountaingod.jpg"]]
  }
};
