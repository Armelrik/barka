<div>
    @livewire('components.header')

    <div class="min-h-screen bg-gray-50 py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-8 flex justify-between items-center">
                <h1 class="text-3xl font-bold text-gray-900">{{ __('messages.promoter.dashboard') }}</h1>
                <a href="{{ route('promoter.properties.create') }}" class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold">
                    {{ __('messages.properties.add_new') }}
                </a>
            </div>
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 mb-1">{{ __('messages.promoter.total_properties') }}</p>
                            <p class="text-3xl font-bold text-primary">{{ $stats['total_properties'] }}</p>
                        </div>
                        <svg class="w-12 h-12 text-primary opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 mb-1">{{ __('messages.promoter.active_bookings') }}</p>
                            <p class="text-3xl font-bold text-green-600">{{ $stats['active_bookings'] }}</p>
                        </div>
                        <svg class="w-12 h-12 text-green-600 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                        </svg>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 mb-1">{{ __('messages.promoter.total_earnings') }}</p>
                            <p class="text-3xl font-bold text-accent">{{ number_format($stats['total_earnings'], 0) }} FCFA</p>
                        </div>
                        <svg class="w-12 h-12 text-accent opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 mb-1">{{ __('messages.promoter.pending_bookings') }}</p>
                            <p class="text-3xl font-bold text-orange-500">{{ $stats['pending_bookings'] }}</p>
                        </div>
                        <svg class="w-12 h-12 text-orange-500 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Additional Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm opacity-90 mb-1">{{ __('messages.promoter.pending_renewals') }}</p>
                            <p class="text-3xl font-bold">{{ $stats['pending_renewals'] }}</p>
                        </div>
                        <a href="{{ route('promoter.renewals') }}" class="text-white hover:text-blue-100">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </a>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm opacity-90 mb-1">{{ __('messages.promoter.pending_maintenance') }}</p>
                            <p class="text-3xl font-bold">{{ $stats['pending_maintenance'] }}</p>
                        </div>
                        <a href="{{ route('promoter.maintenance') }}" class="text-white hover:text-red-100">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </a>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm opacity-90 mb-1">{{ __('messages.promoter.unread_messages') }}</p>
                            <p class="text-3xl font-bold">{{ $stats['unread_messages'] }}</p>
                        </div>
                        <a href="{{ route('promoter.messages') }}" class="text-white hover:text-green-100">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Main Content -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Recent Bookings -->
                    <div class="bg-white rounded-lg shadow-lg">
                        <div class="px-6 py-4 border-b flex justify-between items-center">
                            <h2 class="text-xl font-semibold">{{ __('messages.promoter.recent_bookings') }}</h2>
                            <a href="{{ route('promoter.bookings') }}" class="text-primary hover:text-primary-600 font-medium">
                                {{ __('messages.common.view_all') }} →
                            </a>
                        </div>
                        <div class="p-6">
                            @if ($recentBookings->count() > 0)
                                <div class="space-y-4">
                                    @foreach ($recentBookings as $booking)
                                        <div class="flex justify-between items-start border-b pb-4 last:border-0">
                                            <div class="flex-1">
                                                <div class="font-semibold text-gray-900">{{ app()->getLocale() == 'fr' ? $booking->property->title_fr : $booking->property->title_en }}</div>
                                                <div class="text-sm text-gray-600 mt-1">{{ $booking->customer_name }}</div>
                                                <div class="text-xs text-gray-500 mt-1">{{ $booking->start_date->format('d/m/Y') }} - {{ $booking->end_date->format('d/m/Y') }}</div>
                                            </div>
                                            <div class="text-right ml-4">
                                                <div class="font-bold text-primary">{{ number_format($booking->promoter_amount, 0) }} FCFA</div>
                                                <span class="inline-block px-3 py-1 text-xs rounded-full mt-1
                                                    {{ $booking->status === 'confirmed' ? 'bg-green-100 text-green-800' : '' }}
                                                    {{ $booking->status === 'pending' ? 'bg-orange-100 text-orange-800' : '' }}
                                                    {{ $booking->status === 'active' ? 'bg-blue-100 text-blue-800' : '' }}
                                                    {{ $booking->status === 'completed' ? 'bg-gray-100 text-gray-800' : '' }}">
                                                    {{ __('messages.booking.status.' . $booking->status) }}
                                                </span>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            @else
                                <p class="text-gray-500 text-center py-8">{{ __('messages.promoter.no_bookings') }}</p>
                            @endif
                        </div>
                    </div>

                    <!-- Recent Maintenance -->
                    <div class="bg-white rounded-lg shadow-lg">
                        <div class="px-6 py-4 border-b flex justify-between items-center">
                            <h2 class="text-xl font-semibold">{{ __('messages.promoter.recent_maintenance') }}</h2>
                            <a href="{{ route('promoter.maintenance') }}" class="text-primary hover:text-primary-600 font-medium">
                                {{ __('messages.common.view_all') }} →
                            </a>
                        </div>
                        <div class="p-6">
                            @if ($recentMaintenance->count() > 0)
                                <div class="space-y-3">
                                    @foreach ($recentMaintenance as $request)
                                        <div class="border-l-4 pl-4 py-2
                                            {{ $request->priority == 'urgent' ? 'border-red-500' : '' }}
                                            {{ $request->priority == 'high' ? 'border-orange-500' : '' }}
                                            {{ $request->priority == 'normal' ? 'border-blue-500' : '' }}
                                            {{ $request->priority == 'low' ? 'border-gray-500' : '' }}">
                                            <div class="flex justify-between items-start">
                                                <div>
                                                    <h4 class="font-semibold text-gray-900">{{ $request->title }}</h4>
                                                    <p class="text-sm text-gray-600">{{ app()->getLocale() == 'fr' ? $request->property->title_fr : $request->property->title_en }}</p>
                                                </div>
                                                <span class="px-3 py-1 rounded-full text-xs font-semibold
                                                    {{ $request->status == 'pending' ? 'bg-orange-100 text-orange-800' : '' }}
                                                    {{ $request->status == 'in_progress' ? 'bg-blue-100 text-blue-800' : '' }}
                                                    {{ $request->status == 'completed' ? 'bg-green-100 text-green-800' : '' }}">
                                                    {{ __('messages.maintenance.status.' . $request->status) }}
                                                </span>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            @else
                                <p class="text-gray-500 text-center py-8">{{ __('messages.promoter.no_maintenance') }}</p>
                            @endif
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Pending Renewals -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h3 class="text-lg font-bold mb-4">{{ __('messages.promoter.pending_renewals_title') }}</h3>
                        @if ($pendingRenewals->count() > 0)
                            <div class="space-y-3">
                                @foreach ($pendingRenewals as $renewal)
                                    <div class="bg-blue-50 rounded-lg p-3">
                                        <p class="font-semibold text-sm text-gray-900">{{ app()->getLocale() == 'fr' ? $renewal->property->title_fr : $renewal->property->title_en }}</p>
                                        <p class="text-xs text-gray-600 mt-1">{{ $renewal->user->name }}</p>
                                        <p class="text-xs text-gray-500 mt-1">{{ __('messages.renewal.expires') }}: {{ $renewal->current_end_date->format('d/m/Y') }}</p>
                                    </div>
                                @endforeach
                            </div>
                        @else
                            <p class="text-gray-500 text-sm">{{ __('messages.promoter.no_pending_renewals') }}</p>
                        @endif
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h3 class="text-lg font-bold mb-4">{{ __('messages.promoter.quick_actions') }}</h3>
                        <div class="space-y-2">
                            <a href="{{ route('promoter.properties') }}" class="block w-full px-4 py-2 bg-primary text-white text-center rounded-lg hover:bg-primary-600 transition-colors">
                                {{ __('messages.promoter.manage_properties') }}
                            </a>
                            <a href="{{ route('promoter.bookings') }}" class="block w-full px-4 py-2 border-2 border-primary text-primary text-center rounded-lg hover:bg-primary hover:text-white transition-colors">
                                {{ __('messages.promoter.manage_bookings') }}
                            </a>
                            <a href="{{ route('promoter.renewals') }}" class="block w-full px-4 py-2 border-2 border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-100 transition-colors">
                                {{ __('messages.promoter.manage_renewals') }}
                            </a>
                            <a href="{{ route('promoter.maintenance') }}" class="block w-full px-4 py-2 border-2 border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-100 transition-colors">
                                {{ __('messages.promoter.manage_maintenance') }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @livewire('components.footer')
</div>
