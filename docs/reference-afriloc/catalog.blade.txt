<div>
    @livewire('components.header')

    <div class="container mx-auto px-4 py-24">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold">{{ __('messages.properties.title') }}</h1>
            <div class="flex items-center gap-4">
                <select wire:model.live="sortBy" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                    <option value="latest">{{ __('messages.search.sort.latest') }}</option>
                    <option value="price_asc">{{ __('messages.search.sort.price_asc') }}</option>
                    <option value="price_desc">{{ __('messages.search.sort.price_desc') }}</option>
                    <option value="area_asc">{{ __('messages.search.sort.area_asc') }}</option>
                    <option value="area_desc">{{ __('messages.search.sort.area_desc') }}</option>
                </select>
            </div>
        </div>

        {{-- Advanced Filters --}}
        <div class="bg-white p-6 rounded-lg shadow-md mb-8">
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {{-- Search --}}
                <div class="lg:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.properties.search') }}</label>
                    <input type="text" wire:model.live.debounce.300ms="search" placeholder="{{ __('messages.properties.search_placeholder') }}" 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                </div>

                {{-- Location --}}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.search.location') }}</label>
                    <input type="text" wire:model.live.debounce.300ms="location" placeholder="{{ __('messages.search.location_placeholder') }}" 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                </div>

                {{-- Type --}}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.properties.type') }}</label>
                    <select wire:model.live="typeFilter" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                        <option value="">{{ __('messages.properties.all_types') }}</option>
                        <option value="maison">{{ __('messages.properties.house') }}</option>
                        <option value="appartement">{{ __('messages.properties.apartment') }}</option>
                        <option value="terrain">{{ __('messages.properties.land') }}</option>
                        <option value="bureau">{{ __('messages.properties.office') }}</option>
                        <option value="local_commercial">{{ __('messages.properties.commercial') }}</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {{-- Price Range --}}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.properties.min_price') }}</label>
                    <input type="number" wire:model.live.debounce.300ms="minPrice" placeholder="0" 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.properties.max_price') }}</label>
                    <input type="number" wire:model.live.debounce.300ms="maxPrice" placeholder="Max" 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                </div>

                {{-- Bedrooms --}}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.search.bedrooms') }}</label>
                    <select wire:model.live="bedrooms" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                        <option value="">{{ __('messages.search.any') }}</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                    </select>
                </div>

                {{-- Bathrooms --}}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.search.bathrooms') }}</label>
                    <select wire:model.live="bathrooms" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                        <option value="">{{ __('messages.search.any') }}</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                    </select>
                </div>

                {{-- Area Range --}}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.search.min_area') }}</label>
                    <input type="number" wire:model.live.debounce.300ms="minArea" placeholder="0 m²" 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.search.max_area') }}</label>
                    <input type="number" wire:model.live.debounce.300ms="maxArea" placeholder="Max m²" 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                </div>
            </div>

            {{-- Clear Filters Button --}}
            <div class="mt-4 flex justify-end">
                <button wire:click="clearFilters" class="px-4 py-2 text-primary hover:text-primary-600 font-medium">
                    {{ __('messages.search.clear_filters') }}
                </button>
            </div>
        </div>

        {{-- Results Count --}}
        <div class="mb-4 text-gray-600">
            {{ __('messages.search.results_count', ['count' => $properties->total()]) }}
        </div>

        {{-- Properties Grid --}}
        @if($properties->count() > 0)
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @foreach($properties as $property)
                    @livewire('components.property-card', ['property' => $property], key($property->id))
                @endforeach
            </div>

            <div class="mt-8">
                {{ $properties->links() }}
            </div>
        @else
            <div class="text-center py-20">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <p class="text-xl text-gray-500">{{ __('messages.properties.no_results') }}</p>
                <button wire:click="clearFilters" class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600">
                    {{ __('messages.search.clear_filters') }}
                </button>
            </div>
        @endif
    </div>

    @livewire('components.footer')
</div>
