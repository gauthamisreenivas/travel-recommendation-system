export interface Hotel {
    id: string;
    name: string;
    location: string;
    description: string;
    amenities: string[];
    average_rating?: number;
    image_url: string;
    score?: number;
    price_per_night?: number;
    room_types: RoomType[];
}

export interface RoomType {
    id: string;
    name: string;
    description: string;
    price_per_night: number;
    capacity: number;
    total_rooms: number;
    amenities: string[];
    image_url: string;
}

export interface RoomAvailability {
    room_type: RoomType;
    calendar: DailyAvailability[];
}

export interface DailyAvailability {
    date: string;
    available: number;
    total_rooms: number;
    price: number;
}

export interface Booking {
    id: string;
    hotel_id: string;
    user_id: string;
    room_type_id: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    status: 'confirmed' | 'cancelled' | 'pending';
    created_at: string;
    hotel?: Hotel;
    room_type?: RoomType;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData extends LoginCredentials {
    firstName: string;
    lastName: string;
    confirmPassword: string;
}

export interface SearchFormProps {
    setHotels: (hotels: Hotel[]) => void;
}

export interface HotelListProps {
    hotels: Hotel[];
    onHotelSelect: (hotel: Hotel) => void;
}

export interface HotelDetailProps {
    hotel: Hotel;
}

export interface BookingFormProps {
    hotel: Hotel;
    roomType: RoomType;
    onSubmit: (booking: Partial<Booking>) => void;
} 