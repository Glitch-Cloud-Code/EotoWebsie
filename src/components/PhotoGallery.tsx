import type { GalleryPhotoAsset } from '../content/siteContent'

type PhotoGalleryProps = {
  photos: GalleryPhotoAsset[]
}

function getPhotoSizes(layout: GalleryPhotoAsset['layout']) {
  if (layout === 'wide') {
    return '(max-width: 720px) calc(100vw - 2rem), min(1200px, calc(100vw - 2rem))'
  }

  return '(max-width: 420px) calc(100vw - 2rem), (max-width: 720px) calc((100vw - 3rem) / 2), min(300px, 25vw)'
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  return (
    <section
      aria-labelledby="photos-title"
      className="photo-gallery"
      id="photos"
    >
      <div className="section-heading">
        <span className="section-index">LIVE PHOTOGRAPHY</span>
        <h2 id="photos-title">Photos</h2>
      </div>

      <ul className="photo-gallery-list">
        {photos.map((photo) => (
          <li
            className={`photo-gallery-item photo-gallery-item--${photo.layout}`}
            key={photo.id}
          >
            <figure>
              <img
                alt={photo.alt}
                decoding="async"
                height={photo.height}
                loading="lazy"
                sizes={getPhotoSizes(photo.layout)}
                src={photo.src}
                srcSet={photo.srcSet}
                width={photo.width}
              />
              {photo.caption ? <figcaption>{photo.caption}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
