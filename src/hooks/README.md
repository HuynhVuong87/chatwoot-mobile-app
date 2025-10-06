# useApiRequest Hook

Hook tổng quát để gọi API requests một cách dễ dàng và có thể tái sử dụng trong project Shipxanh Mobile Chat.

## Tính năng

- ✅ Tích hợp với APIService hiện có
- ✅ Hỗ trợ TypeScript với generic types
- ✅ Tự động xử lý authentication headers
- ✅ Loading states và error handling
- ✅ Callbacks onSuccess và onError
- ✅ Manual execution control

## Cách sử dụng

### 1. Hook tổng quát `useApiRequest`

```typescript
import { useApiRequest } from '@/hooks/useApiRequest';

const { run, loading, data, error } = useApiRequest<ResponseType, RequestType>(
  'api/endpoint',
  { method: 'POST' as const },
  {
    manual: true,
    onSuccess: (response) => {
      console.log('Success:', response.data);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  }
);

// Gọi API
await run(requestData);
```

### 2. Hooks chuyên biệt

#### GET Request
```typescript
import { useGetRequest } from '@/hooks/useApiRequest';

const { run: fetchUsers, loading } = useGetRequest<User[]>('users', {}, {
  manual: true,
  onSuccess: (response) => {
    console.log('Users:', response.data);
  },
});

// Gọi API
await fetchUsers();
```

#### POST Request
```typescript
import { usePostRequest } from '@/hooks/useApiRequest';

const { run: createUser } = usePostRequest<User, CreateUserData>('users', {}, {
  manual: true,
  onSuccess: (response) => {
    console.log('User created:', response.data);
  },
});

// Gọi API
await createUser({ name: 'John', email: 'john@example.com' });
```

#### PUT Request
```typescript
import { usePutRequest } from '@/hooks/useApiRequest';

const { run: updateUser } = usePutRequest<User, UpdateUserData>('users/123', {}, {
  manual: true,
});

await updateUser({ name: 'Jane' });
```

#### DELETE Request
```typescript
import { useDeleteRequest } from '@/hooks/useApiRequest';

const { run: deleteUser } = useDeleteRequest<{ success: boolean }>('users/123', {}, {
  manual: true,
});

await deleteUser();
```

## Ví dụ thực tế

### Login với Firebase
```typescript
const LoginComponent = () => {
  const { run: loginWithFirebase, loading } = usePostRequest<
    { token: string; user: User },
    { firebaseToken: string; email: string }
  >('auth/firebase-login', {}, {
    manual: true,
    onSuccess: (response) => {
      // Lưu token và redirect
      AsyncStorage.setItem('token', response.data.token);
      navigation.navigate('Dashboard');
    },
    onError: (error) => {
      Alert.alert('Login Failed', error.message);
    },
  });

  const handleLogin = async (firebaseToken: string, email: string) => {
    await loginWithFirebase({ firebaseToken, email });
  };

  return (
    <Button 
      onPress={() => handleLogin('token', 'user@example.com')}
      loading={loading}
      title="Login"
    />
  );
};
```

### Fetch Conversations
```typescript
const ConversationsList = () => {
  const { run: fetchConversations, loading, data } = useGetRequest<Conversation[]>(
    'conversations',
    {},
    {
      manual: true,
      onError: (error) => {
        showToast({ message: 'Failed to load conversations' });
      },
    }
  );

  useEffect(() => {
    fetchConversations();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      data={data?.data}
      renderItem={({ item }) => <ConversationItem conversation={item} />}
    />
  );
};
```

## API Reference

### `useApiRequest<T, P>(url, config, options)`

**Parameters:**
- `url`: string - API endpoint
- `config`: ApiRequestConfig - Axios config + method
- `options`: ApiRequestOptions - useRequest options

**Returns:**
- `run`: Function để execute request
- `loading`: boolean - Loading state
- `data`: AxiosResponse<T> | undefined - Response data
- `error`: Error | undefined - Error object

### Types

```typescript
interface ApiRequestOptions {
  manual?: boolean;
  onSuccess?: (data: unknown, params: unknown[]) => void;
  onError?: (error: unknown, params: unknown[]) => void;
  refreshDeps?: unknown[];
}

interface ApiRequestConfig extends AxiosRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}
```

## Lưu ý

1. **Authentication**: Hook tự động sử dụng APIService nên headers authentication được xử lý tự động
2. **Base URL**: Base URL được lấy từ Redux store settings
3. **Error Handling**: Lỗi 401 sẽ tự động logout user
4. **TypeScript**: Luôn định nghĩa types cho response và request data
5. **Manual Execution**: Mặc định `manual: true` để kiểm soát khi nào gọi API

## So sánh với cách cũ

### Trước (sử dụng trực tiếp APIService):
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    setLoading(true);
    const response = await apiService.get('users');
    // Xử lý response
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

### Sau (sử dụng useApiRequest):
```typescript
const { run: fetchData, loading, error } = useGetRequest('users', {}, {
  manual: true,
  onSuccess: (response) => {
    // Xử lý response
  },
});
```

Hook mới giúp code ngắn gọn hơn, dễ đọc hơn và có thể tái sử dụng.
