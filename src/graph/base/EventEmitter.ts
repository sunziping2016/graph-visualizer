export default class EventEmitter {
  private readonly events: { [event: string]: Array<(...args: any[]) => any> } = {};

  public addEventListener(event: string, listener: (...args: any[]) => any) {
    if (this.events[event] === undefined) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  public removeEventListener(event: string, listener: (...args: any[]) => any) {
    if (this.events[event] !== undefined) {
      const index = this.events[event].indexOf(listener);
      if (index > -1) {
        this.events[event].splice(index, -1);
      }
    }
  }

  public emit(event: string, ...args: any[]) {
    if (this.events[event] !== undefined) {
      for (const listener of this.events[event]) {
        listener.apply(this, args);
      }
    }
  }
}
