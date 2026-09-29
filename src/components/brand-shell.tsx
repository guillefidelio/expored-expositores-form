import Image from "next/image";
import type { ReactNode } from "react";

export function BrandShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <header className="site-header">
        <div className="header-inner">
          <Image className="brand-logo" src="/logoexpored27.png" alt="ExpoRed 2027" width={595} height={255} priority unoptimized />
          <span className="header-label"><span aria-hidden="true" />Espacio de expositores</span>
        </div>
      </header>
      <main id="contenido" className="page-container">{children}</main>
      <footer className="site-footer">
        <div><strong>ExpoRed 2027</strong><span>Información para expositores</span></div>
        <div className="brand-shapes" aria-hidden="true"><i /><i /><i /><i /></div>
      </footer>
    </>
  );
}
