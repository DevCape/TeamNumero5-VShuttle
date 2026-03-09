import { Component } from "react";
import type { ReactNode } from "react";
import { Dashboard } from "./components/Dashboard";
import scenariosData from "../data/VShuttle-input.json";
import type { Scenario } from "./core/types";

const scenarios = scenariosData as Scenario[];

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-8 max-w-lg text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Errore di Sistema
            </h1>
            <p className="text-gray-300 mb-4">
              Si è verificato un errore nell'HMI. Decisione di sicurezza: STOP.
            </p>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              {this.state.error}
            </p>
            <button
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold min-w-[44px] min-h-[44px]"
              onClick={() => this.setState({ hasError: false, error: "" })}
            >
              Riprova
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Dashboard scenarios={scenarios} />
    </ErrorBoundary>
  );
}
