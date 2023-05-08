import dayjs from 'dayjs'

interface Frontmatter {
  title: string
  description: string
  date: string
}

function Post({ src, slug }: { src: Frontmatter; slug: string }) {
  return (
    <a href={`/posts/${slug}`} className='block mx-4 p-4 group bg-gray-100 active:bg-gray-200'>
      <div className='text-xl font-bold group-hover:underline'>{src.title}</div>
      <div className='truncate'>{src.description}</div>
    </a>
  )
}

export default function Index(params: { posts: Record<string, Frontmatter> }) {
  const sortedFrontmatter = Object.entries(params.posts)
    .map(([index, frontmatter]) => ({ index, frontmatter }))
    .sort((a, b) => dayjs(b.frontmatter.date).diff(dayjs(a.frontmatter.date)))

  return (
    <main>
      <div className='space-y-2'>
        {sortedFrontmatter.map((fm) => (
          <Post src={fm.frontmatter} slug={fm.index} />
        ))}
      </div>
    </main>
  )
}
