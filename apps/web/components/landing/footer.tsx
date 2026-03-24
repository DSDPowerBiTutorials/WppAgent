import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <span className="text-sm font-bold text-white">W</span>
              </div>
              <span className="text-xl font-bold text-gray-900">WppAgent</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Transformando atendimento em saúde com IA
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Links
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Início
                </a>
              </li>
              <li>
                <a href="#results" className="text-sm text-gray-500 hover:text-gray-900">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#features" className="text-sm text-gray-500 hover:text-gray-900">
                  Funcionalidades
                </a>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Contato
            </h3>
            <ul className="mt-4 space-y-2">
              <li className="text-sm text-gray-500">contato@wppagent.com.br</li>
              <li className="text-sm text-gray-500">São Paulo, Brasil</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Política de Segurança
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} WppAgent. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
