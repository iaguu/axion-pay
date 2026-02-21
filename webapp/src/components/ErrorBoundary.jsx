import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps) {
    if (this.props.resetKey && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error("Erro capturado pelo boundary:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onRetry === "function") {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="page-section error-fallback">
          <h2>Ops! Algo deu errado.</h2>
          <p>
            Tivemos uma falha técnica. Atualize a página ou tente novamente mais tarde. Se o problema
            persistir, fale com o suporte.
          </p>
          <div className="error-actions">
            <button className="primary-btn" type="button" onClick={this.handleRetry}>
              Tentar novamente
            </button>
            <a className="ghost-btn" href="https://wa.me/5511933331462" target="_blank" rel="noreferrer">
              Suporte AxionPAY
            </a>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
