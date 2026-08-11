import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  moduleName?: string;
  resetKeys?: any[];
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && this.props.resetKeys && prevProps.resetKeys) {
      // Check if resetKeys changed
      const keysChanged = this.props.resetKeys.some(
        (key, i) => key !== prevProps.resetKeys?.[i]
      );
      if (keysChanged) {
        this.setState({ hasError: false, error: null });
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-[20px] border border-rose-200 bg-rose-50/50 text-rose-800 space-y-4">
          <div className="flex items-center gap-3 text-left">
            <span className="text-[20px]">⚠️</span>
            <div>
              <h3 className="font-extrabold text-[15px]">
                Something went wrong in {this.props.moduleName || "this module"}
              </h3>
              <p className="text-[12px] text-rose-600 mt-1">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
            </div>
          </div>
          <div className="text-left">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-[10px] text-[12px] font-bold transition-all shadow-sm cursor-pointer"
            >
              Retry Module
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
