'use client';

import Link from 'next/link';
import HornbillLogo from '@/components/HornbillLogo';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
import { translations } from '@/lib/i18n';

export default function AboutPage() {
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const t = translations[lang];

  const content = {
    en: {
      title: 'About Sarawak News',
      subtitle: 'Your trusted source for news from the Land of Hornbills',
      mission: 'Our Mission',
      missionText: 'Sarawak News is dedicated to bringing you the latest news and updates from Sarawak, Malaysia. We aggregate news from trusted local sources to provide a comprehensive view of what\'s happening in our beloved state.',
      features: 'What We Offer',
      feature1: 'Real-time News Updates',
      feature1Desc: 'We fetch news from multiple trusted sources every 10 minutes to keep you informed.',
      feature2: 'Multi-language Support',
      feature2Desc: 'Read news in English, Chinese (中文), or Bahasa Melayu - your choice.',
      feature3: 'AI-Powered Summaries',
      feature3Desc: 'Get quick AI-generated summaries of news articles in your preferred language.',
      feature4: 'Text-to-Speech',
      feature4Desc: 'Listen to news summaries using your browser\'s built-in text-to-speech technology.',
      feature5: 'Community Discussions',
      feature5Desc: 'Join the conversation and share your thoughts on news stories.',
      coverage: 'Our Coverage',
      coverageText: 'We cover a wide range of topics including politics, economy, sports, culture, education, health, infrastructure, tourism, environment, and crime - everything that matters to Sarawak.',
      sources: 'Our Sources',
      sourcesText: 'We aggregate news from reputable Malaysian news outlets including The Star, Free Malaysia Today, Borneo Post, and other trusted sources that cover Sarawak news.',
      contact: 'Contact Us',
      contactText: 'Have questions or feedback? We\'d love to hear from you.',
    },
    zh: {
      title: '关于砂拉越新闻',
      subtitle: '您来自犀鸟之乡的可信新闻来源',
      mission: '我们的使命',
      missionText: '砂拉越新闻致力于为您提供来自马来西亚砂拉越的最新新闻和更新。我们从可信的本地来源聚合新闻，为您提供我们挚爱的州内所发生事件的全面视角。',
      features: '我们的服务',
      feature1: '实时新闻更新',
      feature1Desc: '我们每10分钟从多个可信来源获取新闻，让您随时了解最新动态。',
      feature2: '多语言支持',
      feature2Desc: '用英语、中文或马来语阅读新闻——由您选择。',
      feature3: 'AI驱动摘要',
      feature3Desc: '获取您首选语言的AI生成新闻摘要。',
      feature4: '文字转语音',
      feature4Desc: '使用浏览器内置的文字转语音技术收听新闻摘要。',
      feature5: '社区讨论',
      feature5Desc: '加入对话，分享您对新闻故事的看法。',
      coverage: '我们的报道范围',
      coverageText: '我们涵盖广泛的主题，包括政治、经济、体育、文化、教育、健康、基础设施、旅游、环境和犯罪——一切与砂拉越相关的重要事务。',
      sources: '我们的来源',
      sourcesText: '我们从知名的马来西亚新闻媒体聚合新闻，包括星报、自由今日大马、婆罗洲邮报和其他报道砂拉越新闻的可信来源。',
      contact: '联系我们',
      contactText: '有问题或反馈？我们很乐意听取您的意见。',
    },
    ms: {
      title: 'Tentang Berita Sarawak',
      subtitle: 'Sumber berita dipercayai anda dari Bumi Kenyalang',
      mission: 'Misi Kami',
      missionText: 'Berita Sarawak berdedikasi untuk membawa anda berita dan kemaskini terkini dari Sarawak, Malaysia. Kami mengumpul berita dari sumber tempatan yang dipercayai untuk memberikan pandangan menyeluruh tentang apa yang berlaku di negeri tercinta kita.',
      features: 'Apa Yang Kami Tawarkan',
      feature1: 'Kemaskini Berita Masa Nyata',
      feature1Desc: 'Kami mengambil berita dari pelbagai sumber dipercayai setiap 10 minit untuk memastikan anda sentiasa dimaklumkan.',
      feature2: 'Sokongan Pelbagai Bahasa',
      feature2Desc: 'Baca berita dalam Bahasa Inggeris, Cina (中文), atau Bahasa Melayu - pilihan anda.',
      feature3: 'Ringkasan Dikuasakan AI',
      feature3Desc: 'Dapatkan ringkasan berita yang dijana AI dalam bahasa pilihan anda.',
      feature4: 'Teks-ke-Ucapan',
      feature4Desc: 'Dengar ringkasan berita menggunakan teknologi teks-ke-ucapan pelayar anda.',
      feature5: 'Perbincangan Komuniti',
      feature5Desc: 'Sertai perbualan dan kongsi pendapat anda tentang cerita berita.',
      coverage: 'Liputan Kami',
      coverageText: 'Kami meliputi pelbagai topik termasuk politik, ekonomi, sukan, budaya, pendidikan, kesihatan, infrastruktur, pelancongan, alam sekitar, dan jenayah - segala yang penting untuk Sarawak.',
      sources: 'Sumber Kami',
      sourcesText: 'Kami mengumpul berita dari saluran berita Malaysia yang bereputasi termasuk The Star, Free Malaysia Today, Borneo Post, dan sumber dipercayai lain yang meliputi berita Sarawak.',
      contact: 'Hubungi Kami',
      contactText: 'Ada soalan atau maklum balas? Kami ingin mendengar daripada anda.',
    }
  };

  const c = content[lang];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-orange-50 to-white'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 text-white">
        <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <HornbillLogo size="md" className="text-white" />
              <span className="text-xl font-bold">{t.title}</span>
            </Link>
            <Link href="/" className="text-orange-100 hover:text-white text-sm">
              ← {t.backToNews}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="mb-4"><HornbillLogo size="hero" className={isDark ? 'text-orange-400' : 'text-orange-600'} /></div>
          <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {c.title}
          </h1>
          <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {c.subtitle}
          </p>
        </div>

        {/* Mission */}
        <section className={`rounded-2xl p-8 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {c.mission}
          </h2>
          <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {c.missionText}
          </p>
        </section>

        {/* Features */}
        <section className={`rounded-2xl p-8 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {c.features}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '⚡', title: c.feature1, desc: c.feature1Desc },
              { icon: '🌐', title: c.feature2, desc: c.feature2Desc },
              { icon: '🤖', title: c.feature3, desc: c.feature3Desc },
              { icon: '🔊', title: c.feature4, desc: c.feature4Desc },
              { icon: '💬', title: c.feature5, desc: c.feature5Desc },
            ].map((feature, i) => (
              <div key={i} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-orange-50'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coverage */}
        <section className={`rounded-2xl p-8 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {c.coverage}
          </h2>
          <p className={`text-lg leading-relaxed mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {c.coverageText}
          </p>
          <div className="flex flex-wrap gap-2">
            {['Politics', 'Economy', 'Sports', 'Culture', 'Education', 'Health', 'Infrastructure', 'Tourism', 'Environment', 'Crime'].map(cat => (
              <span key={cat} className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                {cat}
              </span>
            ))}
          </div>
        </section>

        {/* Sources */}
        <section className={`rounded-2xl p-8 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {c.sources}
          </h2>
          <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {c.sourcesText}
          </p>
        </section>

        {/* Contact */}
        <section className={`rounded-2xl p-8 text-center ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
            {c.contact}
          </h2>
          <p className={`mb-6 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
            {c.contactText}
          </p>
          <Link
            href="/ai-features"
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            {t.submitFeedback || 'Give Feedback'}
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className={`py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link href="/privacy" className="hover:text-orange-600">Privacy Policy</Link>
          <span>|</span>
          <Link href="/terms" className="hover:text-orange-600">Terms of Service</Link>
        </div>
        <p className="mt-4 text-xs">© 2024 Sarawak News. All rights reserved.</p>
      </footer>
    </div>
  );
}
