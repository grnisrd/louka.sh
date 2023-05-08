const siteLinks = {
  '/': 'home',
  '/docs': 'docs',
  '/contact': 'contact',
}

export default function Layout({ body, uri }: { body: any; uri: string }) {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta http-equiv='X-UA-Compatible' content='IE=edge' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <link rel='stylesheet' href='/index.css'></link>
        <title>louka.sh</title>
      </head>
      <body className='flex flex-col max-w-2xl pt-16 mx-auto'>
        <header className='border-b pb-4 mb-4'>
          <a href='/' className='block w-fit text-4xl mb-4 hover:underline font-bold'>
            louka.sh
          </a>
          <nav className='flex gap-2'>
            {Object.entries(siteLinks).map(([uri, text]) => (
              <a className='text-blue-800 underline hover:no-underline' href={uri}>
                {text}
              </a>
            ))}
            <a
              className='text-blue-800 underline hover:no-underline ml-auto'
              href='https://github.com/grnisrd'
              target='_blank'
            >
              github
            </a>
            <a
              className='text-blue-800 underline hover:no-underline'
              href='https://twitter.com/grnisrd'
              target='_blank'
            >
              twitter
            </a>
          </nav>
        </header>
        <div id='contents' data-slug={uri}>
          {body}
        </div>
        <footer className='flex my-4 py-4 border-t'>
          <div className='text-xl'>🌲🌾</div>
          <a
            className='ml-auto text-gray-400 hover:underline'
            href='https://github.com/grnisrd/louka.sh'
            target='_blank'
          >
            src
          </a>
        </footer>
      </body>
    </html>
  )
}
