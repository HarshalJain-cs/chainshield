import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Window } from "@/components/Window";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Window title="error.boundary" tag="error" tagColor="primary" large>
            <div className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h1 className="font-display text-4xl mb-2">Something went wrong</h1>
              <p className="text-foreground/70 mb-6">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <Button onClick={() => window.location.reload()}>
                Reload page
              </Button>
            </div>
          </Window>
        </div>
      );
    }

    return this.props.children;
  }
}
