'use client';

import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Linkedin, 
  Twitter,
  Heart,
  Sparkles
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produto: [
      { name: 'Como funciona', href: '#features-section' },
      { name: 'Preços', href: '#checkout-section' },
      { name: 'Suporte', href: '#' },
      { name: 'FAQ', href: '#' }
    ],
    empresa: [
      { name: 'Sobre nós', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Carreiras', href: '#' },
      { name: 'Imprensa', href: '#' }
    ],
    legal: [
      { name: 'Termos de Uso', href: '#' },
      { name: 'Política de Privacidade', href: '#' },
      { name: 'Cookies', href: '#' },
      { name: 'LGPD', href: '#' }
    ]
  };

  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' }
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold">Pronto para revolucionar suas campanhas?</h3>
            </div>
            
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de anunciantes que já economizam tempo e dinheiro com a Clara
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => scrollToSection('#checkout-section')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2 inline" />
                Começar agora
              </button>
              
              <button
                onClick={() => {
                  const message = encodeURIComponent('Olá! Gostaria de saber mais sobre a Clara e como ela pode me ajudar com minhas campanhas.');
                  window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
                }}
                className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5 mr-2 inline" />
                Falar no WhatsApp
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-2xl font-bold">Clara IA</h4>
              </div>
              
              <p className="text-blue-100 mb-6 leading-relaxed">
                A assistente de IA que monitora suas campanhas do Google Ads 24h por dia, 
                enviando relatórios e alertas direto no seu WhatsApp.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-blue-100">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>contato@clara.ai</span>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span>(11) 99999-9999</span>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span>São Paulo, Brasil</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <h5 className="text-lg font-semibold text-white mb-4 capitalize">
                {category}
              </h5>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-blue-100 hover:text-white transition-colors duration-200 hover:translate-x-1 transform inline-block"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-2 text-blue-100"
            >
              <span>© {currentYear} Clara IA. Feito com</span>
              <Heart className="w-4 h-4 text-red-400 fill-current" />
              <span>para revolucionar o Google Ads.</span>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center gap-4"
            >
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-blue-200" />
                </a>
              ))}
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center gap-4 text-sm text-blue-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
                <span>LGPD Compatível</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
    </footer>
  );
}
