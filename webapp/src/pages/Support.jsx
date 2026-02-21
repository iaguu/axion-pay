import "../pages.css";

const supportCards = [
  {
    title: "WhatsApp prioritário",
    description:
      "Canal direto com squads comerciais para ajustes de limites, compliance e onboarding em até 15 minutos.",
    action: {
      label: "Falar no WhatsApp",
      href: "https://wa.me/5511933331462?text=Quero%20suporte%20AxionPAY"
    }
  },
  {
    title: "Documentação viva",
    description:
      "Endpoints comentados, payloads prontos e SDKs para Node.js, PHP e cURL com base URL https://pay.axionenterprise.cloud.",
    action: {
      label: "Acessar documentação",
      href: "/docs"
    }
  },
  {
    title: "Chat ao vivo com administração",
    description:
      "Solicite atendimento administrado diretamente pela dashboard do usuário; o time de governança responde no mesmo painel.",
    action: {
      label: "Solicitar chat",
      href: "/dashboard"
    }
  }
];

export default function Support() {
  return (
    <section className="page-section support-page">
      <h1>Suporte AxionPAY</h1>
      <p>
        Estamos online 24/7 com squads técnicos e comerciais. Cada canal complementa o outro para entrega rápida:
        WhatsApp, documentação viva e o chat ao vivo dentro da dashboard com os administradores.
      </p>
      <div className="support-grid">
        {supportCards.map((card) => (
          <article key={card.title} className="support-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <a className="primary-btn" href={card.action.href}>
              {card.action.label}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
