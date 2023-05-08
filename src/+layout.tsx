export default function Layout({ body }: { body: JSX.ElementClass }) {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta http-equiv='X-UA-Compatible' content='IE=edge' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <link rel='stylesheet' href='/index.css'></link>
        <title>louka.sh</title>
      </head>
      <body>{body}</body>
    </html>
  )
}
