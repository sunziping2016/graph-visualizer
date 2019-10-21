<template>
  <div id="app">
    <header class="app-header">
      <h1 class="title">Graph Visualizer</h1>
      <div class="settings">
        <div class="settings-item"
             v-if="desktopLayout"
        >
          <span class="settings-item-title"
                :class="{ 'setting-item-active': settingsOpen }"
                @click="settingsOpen = !settingsOpen">
            侧栏
          </span>
        </div>
      </div>
    </header>
    <main class="main-panes"
          :class="{
            'main-panes-show-sidebarmain-panes-show-sidebar': settingsOpen && desktopLayout
          }"
          v-on="Object.assign({}, sizerMouseActive ? {
            mouseup: onMainSizerMouseUp,
            mousemove: onMainSizerMouseMove
          } : {}, sizerTouchActive ? {
            touchend: onMainSizerTouchEnd,
            touchmove: onMainSizerTouchMove
          } : {})"
    >
      <div class="main-container main-container-graph"
           :class="{ 'main-container-graph-size-active':
                      !sizerMouseActive && !sizerTouchActive}"
           :style="{
             width: desktopLayout ? (settingsOpen ?
                    `calc(100% - ${settingsWidth}px)` : '100%') : 'auto'
           }"
      >
        <div class="main-pane main-pane-graph" ref="canvas">
          <div class="error-pane" v-if="parseError">
            <pre><code>{{ parseError }}</code></pre>
          </div>
          <Graph :width="canvasWidth" :height="canvasHeight" :data="rendered"
          ></Graph>
        </div>
      </div>
      <transition name="sizer-slide-x" :duration="300">
        <div class="main-sizer main-client-settings-sizer"
             v-if="settingsOpen && desktopLayout"
             :style="{ left: `calc(100% - ${settingsWidth}px)` }"
             @mousedown="onMainSizerMouseDown"
             @touchstart="onMainSizerTouchStart"
        ><div class="main-sizer-handlebar"></div></div>
      </transition>
      <transition name="settings-slide-x" :duration="300">
        <div class="main-container main-container-settings"
             v-if="settingsOpen || !desktopLayout"
             :style="{
               width: desktopLayout ? `${settingsWidth}px` : 'auto'
             }"
        >
          <div class="main-pane main-pane-settings">
            <CollapsiblePane class="main-pane-subpane" title="输入">
              <div class="settings-input-file">
                <label for="input-file">
                  <v-icon name="upload" scale="0.8"></v-icon>打开文件
                </label>
                <input type="file" id="input-file" @change="inputFileChange">
              </div>
              <div class="settings-input-format">
                <!--suppress HtmlFormInputWithoutLabel -->
                <select id="input-format" v-model="parser">
                  <option value="json" selected>JSON</option>
                  <option value="graphviz">Graphviz</option>
                </select>
              </div>
              <button class="setting-input-redraw" @click="redraw">
                <v-icon name="sync" scale="0.8"></v-icon>重绘
              </button>
              <div class="settings-input-examples">
                <span class="settings-input-example-label">示例：</span>
                <span class="settings-input-example"
                      v-for="(example, i) in examples"
                      :key="example.name"
                      @click="selectExample(i)"
                >
                  {{ example.name }}
                </span>
              </div>
              <div class="settings-input-display"
                   :class="{ 'settings-input-display-two-column':
                              realSettingsWidth >= 400 }">
                <div class="settings-input-raw">
                  <label for="input-raw">输入数据：</label>
                  <textarea id="input-raw" rows="10" v-model="rawInput">
                  </textarea>
                </div>
                <div class="settings-input-parsed">
                  <label for="input-parsed">解析结果（只读）：</label>
                  <textarea id="input-parsed" rows="10" readonly
                            :value="parsedInput"
                  ></textarea>
                </div>
              </div>
            </CollapsiblePane>
          </div>
        </div>
      </transition>
    </main>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator';
import CollapsiblePane from './components/CollapsiblePane.vue';
import Graph from './components/Graph.vue';
import {
  globalRoot,
  globalParsers,
  globalExamples,
} from './graph/Root';
import 'vue-awesome/icons/upload';
import 'vue-awesome/icons/sync';

@Component({
  components: {
    CollapsiblePane,
    Graph,
  },
})
export default class Group extends Vue {
  get desktopLayout() {
    return this.windowWidth > 719;
  }
  get realSettingsWidth() {
    return this.desktopLayout ? this.settingsWidth : this.canvasWidth;
  }
  // UI data
  // noinspection JSUnusedLocalSymbols
  private settingsOpen = true;
  private settingsWidth = 300;
  private minGraphWidth = 150;
  private minSettingsWidth = 150;
  private sizerMouseActive = false;
  private sizerTouchActive = false;
  private windowWidth = document.documentElement.clientWidth;
  private windowHeight = document.documentElement.clientHeight;
  private canvasWidth = 0;
  private canvasHeight = 0;
  // Input data
  private parser = 'json';
  private rawInput = '';
  private parseError = null;
  private parsedInput = '';
  // noinspection JSUnusedLocalSymbols
  private examples = globalExamples;
  // Rendered data
  // noinspection JSMismatchedCollectionQueryUpdate
  private rendered: object[] = [];
  public parseInput() {
    try {
      if (this.rawInput) {
        const parsed = globalParsers[this.parser](this.rawInput);
        this.parsedInput = JSON.stringify(parsed, null, 2);
        globalRoot.setData(parsed);
      } else {
        this.parsedInput = '';
      }
      this.parseError = null;
    } catch (e) {
      /* tslint:disable:no-console */
      console.log(e);
      this.parseError = e.stack;
    }
  }
  public mounted() {
    window.addEventListener('resize', this.getSize);
    this.updateCanvasSize();
    globalRoot.addEventListener('render', (data: object[]) => {
      this.rendered = data;
      // console.log(JSON.stringify(data, null, 2))
    });
  }
  public beforeDestroy() {
    window.removeEventListener('resize', this.getSize);
  }
  @Watch('settingsWidth')
  public onSettingsWidthChanged() {
    this.updateCanvasSize();
  }
  @Watch('parser')
  public onParserChanged() {
    this.parseInput();
  }
  @Watch('rawInput')
  public onRawInputChanged() {
    this.parseInput();
  }
  public redraw() {
    globalRoot.redraw(JSON.parse(this.parsedInput));
  }
  public selectExample(i: number) {
    const example = globalExamples[i];
    this.parser = example.parser;
    this.rawInput = example.content;
  }
  public inputFileChange(e: InputEvent) {
    const file = (e.target as HTMLInputElement).files![0];
    if (!file) {
      return;
    }
    switch (file.type) {
      case 'application/json':
        this.parser = 'json';
        break;
      case 'text/vnd.graphviz':
        this.parser = 'graphviz';
        break;
      default:
        alert('Unknown file type');
        return;
    }
    const reader = new FileReader();
    reader.onload = (evt: ProgressEvent<FileReader>) => {
      this.rawInput = evt.target!.result as string;
    };
    reader.readAsText(file);
  }
  public getSize() {
    this.windowWidth = document.documentElement.clientWidth;
    this.windowHeight = document.documentElement.clientHeight;
    this.$nextTick(() => this.updateCanvasSize());
  }
  public updateCanvasSize() {
    this.canvasWidth = (this.$refs.canvas as HTMLElement).offsetWidth;
    this.canvasHeight = (this.$refs.canvas as HTMLElement).offsetHeight;
    // globalRoot.setViewportSize(this.canvasWidth, this.canvasHeight);
  }
  public onMainSizerMouseDown() {
    this.sizerMouseActive = true;
  }
  public onMainSizerMouseUp() {
    this.sizerMouseActive = false;
  }
  public onMainSizerMouseMove(e: MouseEvent) {
    if (e.buttons === 0) {
      this.sizerMouseActive = false;
    }
    if (this.sizerMouseActive) {
      let elementOffsetX = 0;
      let target = e.currentTarget;
      while (target) {
        elementOffsetX += (target as HTMLElement).offsetLeft;
        target = (target as HTMLElement).offsetParent;
      }
      const mouseOffsetX = e.pageX;
      const width = (e.currentTarget! as HTMLElement).offsetWidth;
      const offsetX = mouseOffsetX - elementOffsetX;
      if (offsetX >= this.minGraphWidth &&
        (width - offsetX) >= this.minSettingsWidth) {
        this.settingsWidth = Math.round(width - offsetX);
      }
    }
  }
  public onMainSizerTouchStart() {
    this.sizerTouchActive = true;
  }
  public onMainSizerTouchEnd() {
    this.sizerTouchActive = false;
  }
  public onMainSizerTouchMove(e: TouchEvent) {
    if (this.sizerTouchActive) {
      let elementOffsetX = 0;
      let target = e.currentTarget;
      while (target) {
        elementOffsetX += (target as HTMLElement).offsetLeft;
        target = (target as HTMLElement).offsetParent;
      }
      const mouseOffsetX = e.touches[0].pageX;
      const width = (e.currentTarget! as HTMLElement).offsetWidth;
      const offsetX = mouseOffsetX - elementOffsetX;
      if (offsetX >= this.minGraphWidth &&
        (width - offsetX) >= this.minSettingsWidth) {
        this.settingsWidth = Math.round(width - offsetX);
      }
    }
  }
}
</script>

<style lang="stylus">
@import './styles/config.styl'

// Settings Layout
.main-pane-settings
  color lighten($textColor, 10%)
  label
    margin .2rem 0
    padding .2rem
    display inline-block
    font-size .9rem
  textarea
    display block
    width 100%
    padding .2rem
    box-sizing border-box
    border-radius .5rem
    box-shadow 0 0 1px $shadowColor
    resize none
  svg
    padding 0 4px 0 2px
    position relative
    top 2px
  select
    font-size .9rem
    color $themeColor
    margin .2rem 0
    padding .2rem
    background-color lighten($themeColor, 75%)
    border 1px solid lighten($themeColor, 50%)
    border-radius 0.5rem
    option
      margin .2rem 0
      padding .2rem
  .settings-input-file
    display inline-block
    margin-right .5rem
    label
      display inline-block
      color $themeColor
      background-color lighten($themeColor, 75%)
      border 1px solid lighten($themeColor, 50%)
      border-radius 0.5rem
      cursor pointer
    input
      display none
  .settings-input-format
    display inline-block
    margin-right .5rem
  .settings-input-display
    &-two-column
      display flex
      justify-content space-between
      .settings-input-raw, .settings-input-parsed
        width calc(50% - .3rem)
  .setting-input-redraw
    display inline-block
    font-size .9rem
    color $themeColor
    margin .2rem 0
    padding .2rem
    background-color lighten($themeColor, 75%)
    border 1px solid lighten($themeColor, 50%)
    border-radius 0.5rem
    cursor pointer
  .settings-input-examples
    font-size .9rem
    .settings-input-example-label
      margin .2rem 0
      padding .2rem
    .settings-input-example
      color $themeColor
      cursor pointer
      display inline-block
      &:hover
        border-bottom 1px solid $themeColor
    .settings-input-example+.settings-input-example
      margin-left .4rem

// Main Layout
h1
  margin 0

html, body
  margin 0
  height 100%
  background-color $backgroundColor

#app
  padding-top 3.6rem
  height calc(100% - 3.6rem)
  color $textColor

.main-panes
  height 100%
  position relative
  overflow-x hidden

.main-container
  height 100%
  position absolute
  display inline-block
  box-sizing border-box
  &-graph
    left 0
  &-settings
    right 0
    overflow-y auto

.main-pane
  position absolute
  top 0
  right 0
  bottom 0
  left 0
  margin .4rem
  &-graph
    overflow hidden

.main-pane-graph, .main-pane-subpane
  background-color white
  box-shadow 0 0 3px 1px $shadowColor

.main-pane-subpane
  padding .6rem
  overflow hidden

.main-pane-subpane + .main-pane-subpane
  margin-top .4rem
  margin-bottom .4rem

.main-panes-show-sidebar
  .main-pane
    &-graph
      margin-right .3rem
    &-settings
      margin-left .3rem

.main-sizer
  position absolute
  display inline-blocklight
  width 12px
  height 100%
  margin-left -6px
  cursor col-resize
  z-index 5
  &-handlebar
    position absolute
    width 4px
    height 30px
    border-radius 2px
    left 50%
    top 50%
    margin-left -2px
    margin-top -15px
    background-color darken($backgroundColor, 25%)

.app-header
  position fixed
  z-index 20
  top 0
  left 0
  right 0
  height 3.6rem
  box-sizing border-box
  box-shadow 0 0 4px 2px $shadowColor
  padding .7rem 1.5rem
  line-height 2.2rem
  background-color white

.title
  font-size 1.3rem
  font-weight 600

.settings
  position absolute
  top .7rem
  right 1.5rem
  font-size .9rem
  &-item
    display inline-block
    position relative
    &-title
      cursor pointer
      padding .4rem
      box-sizing border-box
      &:hover
        color $themeColor
    &+&
      margin-left 1.5rem

.error-pane
  position absolute
  top 0
  right 0
  bottom 0
  left 0
  z-index 10
  color red
  background-color rgba(255, 255, 255, .9)
  overflow-x auto
  pre
    margin 0

// Responsive
@media(max-width: $MQMobile)
  html, body
    height auto
  #app
    height auto
  .main-panes
    height auto
    position static
  .main-container
    height auto
    position static
    display block
  .main-pane
    position static
    margin-left 0
    margin-right 0
  .main-pane-graph
    height 350px
    margin-bottom 0
    position relative

.setting-item-active
  color $themeColor
  background-color lighten($themeColor, 75%)
  border 1px solid lighten($themeColor, 50%)
  border-radius .5rem

// Animation
.settings-slide-x-enter-active, .settings-slide-x-leave-active
  overflow-x hidden
  .main-pane-settings
    width 100%
    transition left 0.3s ease

.settings-slide-x-enter, .settings-slide-x-leave-to
  .main-pane-settings
    left calc(100% + 0.6rem) !important

.sizer-slide-x-enter-active, .sizer-slide-x-leave-active
  transition left 0.3s ease

.sizer-slide-x-enter, .sizer-slide-x-leave-to
  left calc(100% - 3px) !important

.main-container-graph-size-active
  transition width 0.3s ease
</style>
