import { useState } from 'react'
import { t } from '../i18n'
import './styles/Docs.css'

const BASE_URL = 'https://pay.axionenterprise.cloud'
const RATE_LIMIT_MAX = 100
const RATE_LIMIT_WINDOW_MINUTES = 15

const examples = {
  node: `import fetch from 'node-fetch'\n\nconst response = await fetch('${BASE_URL}/payments/pix', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json',\n    'x-api-key': process.env.AXION_API_KEY\n  },\n  body: JSON.stringify({ amount: 1980, pay_tag: 'time-comercial', method: 'pix' })\n})\n\nconst data = await response.json()\nconsole.log(data)`,
  php: `<?php\n$payload = [\n  'amount' => 3980,\n  'pay_tag' => 'time-comercial',\n  'method' => 'card'\n];\n\n$ch = curl_init('${BASE_URL}/payments/card');\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n  'Content-Type: application/json',\n  'x-api-key: ' . getenv('AXION_API_KEY')\n]);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n$result = curl_exec($ch);\ncurl_close($ch);\necho $result;`,
  curl: `curl -X POST ${BASE_URL}/payments \\\n-H 'Content-Type: application/json' \\\n-H 'x-api-key: sua_chave' \\\n-d '{ "amount": 2500, "method": "pix", "pay_tag": "time-comercial" }'`,
}

const sandboxKey = 'axion_sandbox_sk_live_01HYPERLONGKEYEXAMPLEFORMOBILEWRAP001'

export default function Docs() {
  const [activeTab, setActiveTab] = useState('node')
  const [copyState, setCopyState] = useState('')

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState(label)
      window.setTimeout(() => setCopyState(''), 1600)
    } catch {
      setCopyState('erro')
    }
  }

  return (
    <section className="docsPage">
      <article className="docsCard">
        <p className="eyebrow">API AxionPAY</p>
        <h1>{t('docs.title')}</h1>
        <p>{t('docs.subtitle')}</p>
        <div className="docsActions">
          <button className="docsBtn primary" onClick={() => copy(BASE_URL, 'base')}>{t('docs.copyBaseUrl')}</button>
          <a className="docsBtn" href={BASE_URL} target="_blank" rel="noreferrer">{t('docs.openApi')}</a>
        </div>
      </article>

      <article className="docsCard grid2">
        <div>
          <h2>{t('docs.rateLimitTitle')}</h2>
          <p>
            {RATE_LIMIT_MAX} requisicoes a cada {RATE_LIMIT_WINDOW_MINUTES} minutos por chave.
          </p>
        </div>
        <div>
          <h2>{t('docs.sandboxTitle')}</h2>
          <p>{t('docs.sandboxText')}</p>
        </div>
      </article>

      <article className="docsCard">
        <header className="sandboxHeader">
          <h2>Exemplo de chave sandbox</h2>
          <button className="docsBtn" onClick={() => copy(sandboxKey, 'sandbox')}>Copiar chave</button>
        </header>
        <div className="apiKeyBox" role="status" aria-live="polite">
          <code>{sandboxKey}</code>
        </div>
      </article>

      <article className="docsCard">
        <div className="tabs" role="tablist" aria-label="Exemplos de codigo">
          <button className={activeTab === 'node' ? 'tab active' : 'tab'} onClick={() => setActiveTab('node')}>
            Node.js
          </button>
          <button className={activeTab === 'php' ? 'tab active' : 'tab'} onClick={() => setActiveTab('php')}>
            PHP
          </button>
          <button className={activeTab === 'curl' ? 'tab active' : 'tab'} onClick={() => setActiveTab('curl')}>
            cURL
          </button>
          <button className="docsBtn tabCopy" onClick={() => copy(examples[activeTab], activeTab)}>
            Copiar
          </button>
        </div>
        <pre className="codeBlock">
          <code>{examples[activeTab]}</code>
        </pre>
      </article>

      {copyState && (
        <p className="copyFeedback" role="status" aria-live="polite">
          {copyState === 'erro' ? 'Nao foi possivel copiar agora.' : 'Conteudo copiado para a area de transferencia.'}
        </p>
      )}
    </section>
  )
}
