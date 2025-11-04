/**
 * Pagination Helper
 * Provides pagination and sorting functionality for list queries
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @returns {Object} Pagination options
 */
const parsePagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  // Limit max items per page to prevent abuse
  const maxLimit = 100;
  const safeLimit = limit > maxLimit ? maxLimit : limit;

  return {
    page,
    limit: safeLimit,
    skip
  };
};

/**
 * Parse sort parameters from request query
 * @param {string} sortQuery - Sort query string (e.g., "-createdAt,name")
 * @returns {Object} MongoDB sort object
 */
const parseSort = (sortQuery) => {
  if (!sortQuery) {
    return { createdAt: -1 }; // Default: newest first
  }

  const sortObj = {};
  const fields = sortQuery.split(',');

  fields.forEach(field => {
    if (field.startsWith('-')) {
      // Descending order
      sortObj[field.substring(1)] = -1;
    } else {
      // Ascending order
      sortObj[field] = 1;
    }
  });

  return sortObj;
};

/**
 * Create pagination metadata
 * @param {number} total - Total number of documents
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const createPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Paginate Mongoose query
 * @param {Query} query - Mongoose query
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Paginated results with metadata
 */
const paginate = async (query, options) => {
  const { page, limit, skip, sort } = options;

  // Execute query with pagination
  const [data, total] = await Promise.all([
    query.skip(skip).limit(limit).sort(sort).lean(),
    query.model.countDocuments(query.getFilter())
  ]);

  const meta = createPaginationMeta(total, page, limit);

  return {
    data,
    pagination: meta
  };
};

module.exports = {
  parsePagination,
  parseSort,
  createPaginationMeta,
  paginate
};
