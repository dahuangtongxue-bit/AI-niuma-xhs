import './globals.css';

export const metadata = {
  title: '数字员工 · 阿桃｜小红书运营专员',
  description: '每天交付 3 套能直接发布的小红书笔记：封面、标题、正文、标签。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.loli.net" />
        <link rel="preconnect" href="https://gstatic.loli.net" crossOrigin="anonymous" />
        <link
          href="https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=ZCOOL+KuaiLe&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
