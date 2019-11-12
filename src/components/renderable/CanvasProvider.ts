export default interface CanvasProvider {
  context: null | CanvasRenderingContext2D;
  hitContext: null | CanvasRenderingContext2D;
  hitColorMap: { [color: string]: string };
  hitIdMap: { [id: string]: string };
}
