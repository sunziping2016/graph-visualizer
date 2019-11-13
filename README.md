# 关于

这个项目的最终目标是可以可视化VFG，更高级的目标是可视化dot文件，并可以方便的画自动机之类的图。

[此处](https://sunziping2016.github.io/graph-visualizer/)是项目的产品。目前还在开发中。

# 界面使用指南

在桌面端，标题栏右侧有“侧栏”，点击后可以收起或展开侧栏；在移动端，侧栏会显示在最下方，不可收起。可以鼠标拖动主界面可视化结果和侧栏之间的分割线。主界面左侧是可视化结果，如果输入有错误，错误信息也会显示在这里。可以鼠标左键拖动、滚轮缩放可视化结果。可视化结果右上方有缩略图，缩略图通过白色的框表示当前的视窗，可以鼠标左键拖动视窗。

主界面右侧是侧栏，目前只有输入面板。输入面板第一层，“打开文件”可以打开本地的dot或json文件，之后的选择框可以选择格式，目前只支持解析json格式，点击“重绘”按钮会重新绘制可视化结果。输入面板第二层是示例，点击示例可以直接作为输入数据。目前有以下几个示例：

- `stdThreadJoinJson`：这是一个VFG的示例；
- `record`：展示record节点；
- `subGraph`：展示嵌套子图；
- `icosahedronJson`：展示正二十面体的布局；
- `table`：展示table节点。

示例下方是输入数据和解析结果，后者只读。对于json格式来讲，这两者是相同的。对于输入数据的更新，可视化结果会增量显示，比如对标签的更改并不会重新触发布局算法。

# json语法指南

详细的语法可以见[dataInput.ts](https://github.com/sunziping2016/graph-visualizer/blob/master/src/graph/base/data.ts)。

输入json里的东西主要由3种对象组成，节点、边和图。

节点对象的内容大致如下：

```json
{
  "type": "node",
  "shape": "boxOrRecordOrTable",
  "id": "someId",
  "label": "someLabel"
}
```

这里`id`是必须的目前`shape`只有3中`box`、`record`和`table`。`box`节点可以通过`style`、`fillColor`、`strokeColor`、`strokeWidth`、`fontSize`、`fontFamily`、`lineHeight`、`padding`、`align`属性来控制样式。`record`节点也与`box`类似，不过其`label`遵循以下文法：

```
recordLabel
  : field ('|' field )*
  ;
field
  : (’<’ string ’>’)? string?
  | '{' recordLabel '}'
  ;
```

`record`节点还有`direction`属性可以是`horizontal`和`vertical`来指定起始排版方向。`table`节点的`label`则可以是类似于html的`table`标签。

对于图，其内容大致如下：

```json
{
  "type": "graph",
  "shape": "box",
  "id": "someId",
  "layout": {
    "type": "KamadaKawai"
  },
  "component": {
    "type": "linear",
    "direction": "TD"
  },
  "children": []
}
```

图对象目前只支持`box`排版，它可以有与`box`节点一样的属性，此外还有`labelPosition`可以指定标签的位置。`id`字段是必须的。`layout`目前只支持`KamadaKwai`算法，它还有`springLength`和`springConstant`这两个参数。`component`负责对多个连通分量之间的布局，目前只有线性布局，其`direction`参数可以指定方向，`spaceBetween`参数可以指定间距。`children`是图的子对象，可以是子图、节点和边。

边的内容大致如下：

```json
{
  "type": "edge",
  "id": "someId",
  "from": "fromPort",
  "to": "toPort"
}
```

如果没有重边，`id`可以省略。`from`和`to`是到port对象的路径，格式类似`graphOuter:graphInner:port`，port对象可以是图、节点、或者record和table节点的一个cell。
