import { Link } from 'react-router-dom'

const LEVEL_COLORS = {
  beginner:     'bg-green-900/50 text-green-400',
  intermediate: 'bg-yellow-900/50 text-yellow-400',
  advanced:     'bg-red-900/50 text-red-400',
  all:          'bg-blue-900/50 text-blue-400',
}

export default function CourseCard({ course }) {
  return (
    <Link to={`/courses/${course.slug}`} className="card hover:border-primary-700 transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      <div className="relative aspect-video bg-dark-600">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-dark-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
        }
        {course.is_free
          ? <span className="absolute top-2 left-2 badge bg-green-600 text-white text-xs">Free</span>
          : null
        }
        {course.is_enrolled
          ? <span className="absolute top-2 right-2 badge bg-primary-700 text-white text-xs">Enrolled</span>
          : null
        }
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`badge text-xs ${LEVEL_COLORS[course.level] || LEVEL_COLORS.all}`}>
            {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
          </span>
          {course.category && (
            <span className="badge bg-dark-600 text-gray-400 text-xs">{course.category}</span>
          )}
        </div>
        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 flex-1">{course.title}</h3>
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="text-xs text-gray-400">
            {course.total_lessons > 0 && <span>{course.total_lessons} lessons</span>}
            {course.duration_hours > 0 && <span> · {course.duration_hours}h</span>}
          </div>
          <div className="font-bold text-white">
            {course.is_free || parseFloat(course.price) === 0
              ? <span className="text-green-400">Free</span>
              : <span>${parseFloat(course.price).toFixed(2)}</span>
            }
          </div>
        </div>
        {course.instructor && (
          <p className="text-xs text-gray-500 mt-2">by {course.instructor}</p>
        )}
      </div>
    </Link>
  )
}
