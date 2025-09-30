const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Laundry Service API',
    description: 'REST API for managing multi-outlet laundry operations.',
    version: '1.0.0',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          pageCount: { type: 'integer', example: 3 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {},
          meta: { $ref: '#/components/schemas/PaginationMeta' },
          errors: {},
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'name', 'password', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          password: { type: 'string', format: 'password', minLength: 8 },
          role: { type: 'string', enum: ['SUPERADMIN', 'ADMIN', 'CASHIER', 'COURIER'] },
          outletId: { type: 'string', format: 'uuid', nullable: true },
          isActive: { type: 'boolean', default: true },
        },
      },
      CustomerRequest: {
        type: 'object',
        required: ['name', 'phone'],
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email', nullable: true },
          address: { type: 'string', nullable: true },
        },
      },
      ServiceRequest: {
        type: 'object',
        required: ['outletId', 'name', 'type', 'unit', 'price'],
        properties: {
          outletId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: { type: 'string', example: 'kiloan' },
          unit: { type: 'string', example: 'kg' },
          price: { type: 'number', format: 'double', example: 7000 },
          isActive: { type: 'boolean', default: true },
        },
      },
      VoucherRequest: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'DISC10' },
          description: { type: 'string' },
          percentOff: { type: 'integer', minimum: 0, maximum: 100 },
          flatOff: { type: 'number', format: 'double' },
          minSubtotal: { type: 'number', format: 'double' },
          maxDiscount: { type: 'number', format: 'double' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean' },
        },
      },
      OrderItemRequest: {
        type: 'object',
        required: ['serviceId', 'qty'],
        properties: {
          serviceId: { type: 'string', format: 'uuid' },
          qty: { type: 'number', format: 'double', minimum: 0.1 },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['outletId', 'customerId', 'items'],
        properties: {
          outletId: { type: 'string', format: 'uuid' },
          customerId: { type: 'string', format: 'uuid' },
          items: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/OrderItemRequest' },
          },
          voucherCode: { type: 'string', nullable: true },
          isExpress: { type: 'boolean', default: false },
          expressFee: { type: 'number', format: 'double', nullable: true },
          notes: { type: 'string', nullable: true },
        },
      },
      UpdateOrderRequest: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'RECEIVED', 'WASHING', 'DRYING', 'IRONING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELED'],
          },
          notes: { type: 'string', nullable: true },
          isExpress: { type: 'boolean' },
          expressFee: { type: 'number', format: 'double', nullable: true },
          readyAt: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      PaymentRequest: {
        type: 'object',
        required: ['method', 'amount'],
        properties: {
          method: { type: 'string', example: 'cash' },
          amount: { type: 'number', format: 'double' },
          note: { type: 'string', nullable: true },
        },
      },
      PickupRequest: {
        type: 'object',
        properties: {
          pickupAddress: { type: 'string', nullable: true },
          deliveryAddress: { type: 'string', nullable: true },
          scheduledAt: { type: 'string', format: 'date-time', nullable: true },
          courierId: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      OutletRequest: {
        type: 'object',
        required: ['code', 'name', 'address'],
        properties: {
          code: { type: 'string', example: 'OUT1' },
          name: { type: 'string' },
          address: { type: 'string' },
          phone: { type: 'string', nullable: true },
        },
      },
      SalesReportResponse: {
        type: 'object',
        properties: {
          totalRevenue: { type: 'number', format: 'double' },
          totalPaid: { type: 'number', format: 'double' },
          outstanding: { type: 'number', format: 'double' },
          orderCount: { type: 'integer' },
          paidOrderCount: { type: 'integer' },
        },
      },
      TopServiceResponse: {
        type: 'object',
        properties: {
          service: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              type: { type: 'string' },
              outletId: { type: 'string', format: 'uuid' },
            },
          },
          totalSales: { type: 'number', format: 'double' },
          totalQty: { type: 'number', format: 'double' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication & session APIs' },
    { name: 'Users', description: 'User management APIs' },
    { name: 'Outlets', description: 'Laundry outlets management' },
    { name: 'Customers', description: 'Customer directory APIs' },
    { name: 'Services', description: 'Laundry services catalog' },
    { name: 'Vouchers', description: 'Promotions and voucher codes' },
    { name: 'Orders', description: 'Order processing and fulfillment' },
    { name: 'Reports', description: 'Analytics and reporting' },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/register': {
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Auth'],
        summary: 'Create new user (admin/superadmin only)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: { description: 'User created' },
          403: { description: 'No permission' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'New tokens issued' },
          401: { description: 'Invalid refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Logged out' } },
      },
    },
    '/auth/me': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Auth'],
        summary: 'Get current user profile',
        responses: { 200: { description: 'Current user' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/users': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Users'],
        summary: 'List users',
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'role', schema: { type: 'string', enum: ['SUPERADMIN', 'ADMIN', 'CASHIER', 'COURIER'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: { 200: { description: 'Users list' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Users'],
        summary: 'Create new user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: { 201: { description: 'User created' }, 403: { description: 'No permission' } },
      },
    },
    '/users/{id}': {
      patch: {
        security: [{ bearerAuth: [] }],
        tags: ['Users'],
        summary: 'Update user',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'User updated' }, 404: { description: 'User not found' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Users'],
        summary: 'Delete user',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'User deleted' }, 404: { description: 'User not found' } },
      },
    },
    '/outlets': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Outlets'],
        summary: 'List outlets (superadmin only)',
        responses: { 200: { description: 'Outlets list' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Outlets'],
        summary: 'Create outlet',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OutletRequest' } } } },
        responses: { 201: { description: 'Outlet created' } },
      },
    },
    '/outlets/{id}': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Outlets'],
        summary: 'Get outlet detail',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Outlet detail' }, 404: { description: 'Not found' } },
      },
      patch: {
        security: [{ bearerAuth: [] }],
        tags: ['Outlets'],
        summary: 'Update outlet',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Outlet updated' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Outlets'],
        summary: 'Delete outlet',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'Outlet deleted' } },
      },
    },
    '/customers': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Customers'],
        summary: 'List customers',
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: { 200: { description: 'Customers list' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Customers'],
        summary: 'Create customer',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerRequest' } } } },
        responses: { 201: { description: 'Customer created' } },
      },
    },
    '/customers/{id}': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Customers'],
        summary: 'Get customer',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Customer detail' }, 404: { description: 'Not found' } },
      },
      patch: {
        security: [{ bearerAuth: [] }],
        tags: ['Customers'],
        summary: 'Update customer',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Customer updated' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Customers'],
        summary: 'Delete customer',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'Customer deleted' } },
      },
    },
    '/services': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Services'],
        summary: 'List services',
        parameters: [
          { in: 'query', name: 'type', schema: { type: 'string' } },
          { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
          { in: 'query', name: 'outletId', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Services list' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Services'],
        summary: 'Create service',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceRequest' } } } },
        responses: { 201: { description: 'Service created' } },
      },
    },
    '/services/{id}': {
      patch: {
        security: [{ bearerAuth: [] }],
        tags: ['Services'],
        summary: 'Update service',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Service updated' }, 404: { description: 'Not found' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Services'],
        summary: 'Deactivate service',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'Service deactivated' } },
      },
    },
    '/vouchers': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Vouchers'],
        summary: 'List vouchers',
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Vouchers list' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Vouchers'],
        summary: 'Create voucher',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VoucherRequest' } } } },
        responses: { 201: { description: 'Voucher created' } },
      },
    },
    '/vouchers/{id}': {
      patch: {
        security: [{ bearerAuth: [] }],
        tags: ['Vouchers'],
        summary: 'Update voucher',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Voucher updated' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Vouchers'],
        summary: 'Deactivate voucher',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'Voucher deactivated' } },
      },
    },
    '/orders': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'List orders',
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'customerId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'outletId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'sort', schema: { type: 'string', example: 'createdAt.desc' } },
        ],
        responses: { 200: { description: 'Orders list' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Create order',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrderRequest' } } } },
        responses: { 201: { description: 'Order created' } },
      },
    },
    '/orders/{id}': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Get order detail',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Order detail' }, 404: { description: 'Not found' } },
      },
      patch: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Update order status or metadata',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateOrderRequest' } } } },
        responses: { 200: { description: 'Order updated' }, 400: { description: 'Invalid transition' } },
      },
    },
    '/orders/{id}/items': {
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Add item to order',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderItemRequest' } } } },
        responses: { 201: { description: 'Item added' } },
      },
    },
    '/orders/{id}/items/{itemId}': {
      patch: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Update order item quantity',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          { in: 'path', name: 'itemId', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['qty'],
                properties: { qty: { type: 'number', format: 'double', minimum: 0.1 } },
              },
            },
          },
        },
        responses: { 200: { description: 'Item updated' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Remove order item',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          { in: 'path', name: 'itemId', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Item removed' } },
      },
    },
    '/orders/{id}/payments': {
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Add payment to order',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentRequest' } } } },
        responses: { 201: { description: 'Payment recorded' } },
      },
    },
    '/orders/{id}/pickup': {
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Create pickup/delivery assignment',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PickupRequest' } } } },
        responses: { 200: { description: 'Pickup created' } },
      },
      patch: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Update pickup/delivery assignment',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PickupRequest' } } } },
        responses: { 200: { description: 'Pickup updated' } },
      },
    },
    '/orders/{id}/cancel': {
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Orders'],
        summary: 'Cancel order',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { reason: { type: 'string', nullable: true } },
              },
            },
          },
        },
        responses: { 200: { description: 'Order canceled' } },
      },
    },
    '/reports/sales': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Reports'],
        summary: 'Sales report',
        parameters: [
          { in: 'query', name: 'outletId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          200: {
            description: 'Sales metrics',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SalesReportResponse' } } },
          },
        },
      },
    },
    '/reports/top-services': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Reports'],
        summary: 'Top performing services',
        parameters: [
          { in: 'query', name: 'outletId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 20, default: 5 } },
        ],
        responses: {
          200: {
            description: 'Top services ranked by revenue',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TopServiceResponse' },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default swaggerSpec;
