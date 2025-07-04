export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameTimeHistory: number[] = [];
  private readonly maxHistoryLength = 60;

  updateFrame() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    this.frameTimeHistory.push(deltaTime);
    if (this.frameTimeHistory.length > this.maxHistoryLength) {
      this.frameTimeHistory.shift();
    }
    
    this.frameCount++;
    
    // Calculate FPS every second
    if (this.frameCount % 60 === 0) {
      const averageFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      this.fps = Math.round(1000 / averageFrameTime);
    }
    
    this.lastTime = currentTime;
  }

  getFPS(): number {
    return this.fps;
  }

  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 16.67; // 60 FPS default
    return this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
  }

  isPerformanceGood(): boolean {
    return this.fps >= 55; // Consider 55+ FPS as good performance
  }

  getPerformanceReport(): {
    fps: number;
    averageFrameTime: number;
    isGood: boolean;
    recommendation?: string;
  } {
    const report = {
      fps: this.getFPS(),
      averageFrameTime: this.getAverageFrameTime(),
      isGood: this.isPerformanceGood()
    };

    if (!report.isGood) {
      return {
        ...report,
        recommendation: "Consider reducing visual effects or closing other browser tabs for better performance."
      };
    }

    return report;
  }
}

export const performanceMonitor = new PerformanceMonitor();