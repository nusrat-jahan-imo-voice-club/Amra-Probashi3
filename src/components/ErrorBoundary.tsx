import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props!: Props;
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in application:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: "32px", 
          color: "#dc2626", 
          backgroundColor: "#fef2f2", 
          border: "2px solid #fca5a5",
          borderRadius: "12px",
          margin: "16px",
          fontFamily: "monospace",
          fontSize: "14px",
          lineHeight: "1.6"
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>অ্যাপ্লিকেশন ত্রুটি ধরা পড়েছে (Runtime Exception Captured):</h2>
          <div style={{ 
            backgroundColor: "#ffffff", 
            padding: "16px", 
            borderRadius: "8px", 
            border: "1px solid #fee2e2",
            overflowX: "auto"
          }}>
            <strong style={{ display: "block", marginBottom: "8px", color: "#991b1b" }}>Error Message:</strong>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{this.state.error?.toString()}</pre>
          </div>
          {this.state.error?.stack && (
            <div style={{ 
              marginTop: "16px",
              backgroundColor: "#27272a", 
              color: "#f4f4f5",
              padding: "16px", 
              borderRadius: "8px", 
              overflowX: "auto"
            }}>
              <strong style={{ display: "block", marginBottom: "8px", color: "#a1a1aa" }}>Stack Trace:</strong>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "12px" }}>{this.state.error.stack}</pre>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ধাপটি পুনরায় লোড করুন (Reload Page)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
