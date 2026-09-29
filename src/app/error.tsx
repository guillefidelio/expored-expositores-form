"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="page-container fallback-page"><h1>No pudimos cargar el formulario.</h1><p>Intentá nuevamente en unos minutos.</p><button className="submit-button" onClick={reset}>Intentar nuevamente</button></main>;
}
