<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'BARKA Location')</title>

    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <!-- Select2 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
    <!-- DataTables French Language -->
    <link rel="preload" href="https://cdn.datatables.net/plug-ins/1.11.5/i18n/fr-FR.json" as="fetch" crossorigin>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="{{ asset('plugins/fontawesome-free/css/all.min.css') }}">
    <!-- Ionicons -->
    <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
    <!-- Tempusdominus Bootstrap 4 -->
    <link rel="stylesheet"
        href="{{ asset('plugins/tempusdominus-bootstrap-4/css/tempusdominus-bootstrap-4.min.css') }}">
    <!-- iCheck -->
    <link rel="stylesheet" href="{{ asset('plugins/icheck-bootstrap/icheck-bootstrap.min.css') }}">
    <!-- JQVMap -->
    <link rel="stylesheet" href="{{ asset('plugins/jqvmap/jqvmap.min.css') }}">
    <!-- Theme style -->
    <link rel="stylesheet" href="{{ asset('dist/css/adminlte.css') }}">
    <!-- Admin Custom Styles -->
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
    <!-- overlayScrollbars -->
    <link rel="stylesheet" href="{{ asset('plugins/overlayScrollbars/css/OverlayScrollbars.min.css') }}">
    <!-- Daterange picker -->
    <link rel="stylesheet" href="{{ asset('plugins/daterangepicker/daterangepicker.css') }}">
    <!-- DataTables -->
    <link rel="stylesheet" href="{{ asset('plugins/datatables-bs4/css/dataTables.bootstrap4.min.css') }}">
    <link rel="stylesheet" href="{{ asset('plugins/datatables-responsive/css/responsive.bootstrap4.min.css') }}">
    <link rel="stylesheet" href="{{ asset('plugins/datatables-buttons/css/buttons.bootstrap4.min.css') }}">
    <!-- Select2 -->
    <link rel="stylesheet" href="{{ asset('plugins/select2/css/select2.min.css') }}">
    <link rel="stylesheet" href="{{ asset('plugins/select2-bootstrap4-theme/select2-bootstrap4.min.css') }}">
    <!-- summernote -->
    <link rel="stylesheet" href="{{ asset('plugins/summernote/summernote-bs4.min.css') }}">
    <!-- Styles customs -->
    @stack('styles')
</head>

<body class="hold-transition sidebar-mini layout-fixed">
    <!-- Site wrapper -->
    <div class="wrapper">
        <!-- Navbar -->
        <nav class="main-header navbar navbar-expand navbar-white navbar-light shadow-sm fixed-top">
            <div class="container-fluid">
                <!-- Left Section: Menu Toggle + Logo -->
                <div class="d-flex align-items-center">
                    <a class="nav-link nav-link-modern " data-widget="pushmenu" href="#" role="button">
                        <i class="fas fa-bars"></i>
                    </a>

                </div>



                <!-- Right Section: Actions -->
                <ul class="navbar-nav ms-auto align-items-center">

                    <!-- Navbar Search -->
                    <li class="nav-item">
                        <a class="nav-link" data-widget="navbar-search" href="#" role="button">
                            <i class="fas fa-search"></i>
                        </a>
                        <div class="navbar-search-block">
                            <form class="form-inline">
                                <div class="input-group input-group-sm">
                                    <input class="form-control form-control-navbar" type="search" placeholder="Search"
                                        aria-label="Search">
                                    <div class="input-group-append">
                                        <button class="btn btn-navbar" type="submit">
                                            <i class="fas fa-search"></i>
                                        </button>
                                        <button class="btn btn-navbar" type="button" data-widget="navbar-search">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </li>
                    <!-- Fullscreen Toggle -->
                    <li class="nav-item">
                        <a class="nav-link action-btn" data-widget="fullscreen" href="#" role="button">
                            <i class="fas fa-expand-arrows-alt"></i>
                        </a>
                    </li>

                    <!-- Messages Dropdown Menu -->
                    <li class="nav-item dropdown">
                        <a class="nav-link" data-toggle="dropdown" href="#">
                            <i class="far fa-comments"></i>
                            <span class="badge badge-danger navbar-badge">3</span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                            <a href="#" class="dropdown-item">
                                <!-- Message Start -->
                                <div class="media">
                                    <img src="dist/img/user1-128x128.jpg" alt="User Avatar"
                                        class="img-size-50 mr-3 img-circle">
                                    <div class="media-body">
                                        <h3 class="dropdown-item-title">
                                            Brad Diesel
                                            <span class="float-right text-sm text-danger"><i
                                                    class="fas fa-star"></i></span>
                                        </h3>
                                        <p class="text-sm">Call me whenever you can...</p>
                                        <p class="text-sm text-muted"><i class="far fa-clock mr-1"></i> 4 Hours Ago</p>
                                    </div>
                                </div>
                                <!-- Message End -->
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item">
                                <!-- Message Start -->
                                <div class="media">
                                    <img src="dist/img/user8-128x128.jpg" alt="User Avatar"
                                        class="img-size-50 img-circle mr-3">
                                    <div class="media-body">
                                        <h3 class="dropdown-item-title">
                                            John Pierce
                                            <span class="float-right text-sm text-muted"><i
                                                    class="fas fa-star"></i></span>
                                        </h3>
                                        <p class="text-sm">I got your message bro</p>
                                        <p class="text-sm text-muted"><i class="far fa-clock mr-1"></i> 4 Hours Ago</p>
                                    </div>
                                </div>
                                <!-- Message End -->
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item">
                                <!-- Message Start -->
                                <div class="media">
                                    <img src="dist/img/user3-128x128.jpg" alt="User Avatar"
                                        class="img-size-50 img-circle mr-3">
                                    <div class="media-body">
                                        <h3 class="dropdown-item-title">
                                            Nora Silvester
                                            <span class="float-right text-sm text-warning"><i
                                                    class="fas fa-star"></i></span>
                                        </h3>
                                        <p class="text-sm">The subject goes here</p>
                                        <p class="text-sm text-muted"><i class="far fa-clock mr-1"></i> 4 Hours Ago</p>
                                    </div>
                                </div>
                                <!-- Message End -->
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item dropdown-footer">See All Messages</a>
                        </div>
                    </li>
                    <!-- Notifications Dropdown Menu -->
                    @php
                        $unreadNotifications = Auth::user() ? \App\Models\Notification::where('utilisateur_id', Auth::id())
                            ->where('est_lue', false)
                            ->latest('date_envoi')
                            ->take(10)
                            ->get() : collect([]);
                        $unreadCount = Auth::user() ? \App\Models\Notification::where('utilisateur_id', Auth::id())
                            ->where('est_lue', false)
                            ->count() : 0;
                    @endphp
                    <li class="nav-item dropdown">
                        <a class="nav-link" data-toggle="dropdown" href="#">
                            <i class="far fa-bell"></i>
                            @if($unreadCount > 0)
                                <span class="badge badge-warning navbar-badge">{{ $unreadCount }}</span>
                            @endif
                        </a>
                        <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                            <span class="dropdown-item dropdown-header">{{ $unreadCount > 0 ? $unreadCount . ' Notification' . ($unreadCount > 1 ? 's' : '') : 'Aucune notification' }}</span>
                            <div class="dropdown-divider"></div>
                            @forelse($unreadNotifications as $notification)
                                <form action="{{ route('admin.notifications.read', $notification->id) }}" method="POST" class="d-inline w-100">
                                    @csrf
                                    <button type="submit" class="dropdown-item w-100 text-left border-0 bg-transparent" style="cursor: pointer;">
                                        @php
                                            $iconClass = match($notification->type) {
                                                'VALIDATION' => 'fas fa-check-circle',
                                                'RESERVATION' => 'fas fa-calendar-check',
                                                'PAIEMENT' => 'fas fa-dollar-sign',
                                                'REJET' => 'fas fa-times-circle',
                                                default => 'fas fa-bell',
                                            };
                                            $colorClass = match($notification->priorite) {
                                                'URGENTE' => 'text-danger',
                                                'HAUTE' => 'text-warning',
                                                'NORMALE' => 'text-info',
                                                default => 'text-muted',
                                            };
                                        @endphp
                                        <i class="{{ $iconClass }} mr-2 {{ $colorClass }}"></i>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div class="flex-grow-1">
                                                <div class="text-sm font-weight-bold">{{ Str::limit($notification->contenu, 50) }}</div>
                                                <div class="text-xs text-muted">{{ $notification->date_envoi ? $notification->date_envoi->diffForHumans() : '' }}</div>
                                            </div>
                                        </div>
                                    </button>
                                </form>
                                @if(!$loop->last)
                                    <div class="dropdown-divider"></div>
                                @endif
                            @empty
                                <div class="dropdown-item text-center text-muted py-3">
                                    <i class="far fa-bell fa-2x mb-2"></i>
                                    <p class="mb-0">Aucune notification</p>
                                </div>
                            @endforelse
                            @if($unreadCount > 0)
                                <div class="dropdown-divider"></div>
                                <form action="{{ route('admin.notifications.read-all') }}" method="POST" class="d-inline">
                                    @csrf
                                    <button type="submit" class="dropdown-item dropdown-footer text-center w-100 border-0 bg-transparent" style="cursor: pointer;">
                                        Marquer tout comme lu
                                    </button>
                                </form>
                            @endif
                        </div>
                    </li>



                    <!-- User Profile Dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button"
                            id="userDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <div class="bg-danger rounded-circle text-white d-flex justify-content-center align-items-center"
                                style="width: 32px; height: 32px; font-weight: 550; border: 1px solid #fff;">
                                {{ strtoupper(substr(Auth::user()->nom ?? Auth::user()->name ?? 'A', 0, 1) . substr(Auth::user()->prenom ?? Auth::user()->name ?? 'D', 0, 1)) }}
                            </div>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right user-dropdown-menu p-2 shadow"
                            style="min-width: 230px;" aria-labelledby="userDropdown">
                            <div class="px-2 py-1">
                                <div class="font-weight-bold">{{ Auth::user()->nom ?? '' }} {{ Auth::user()->prenom ?? '' }}</div>
                                <div class="text-muted small">{{ Auth::user()->email ?? 'admin@admin.com' }}</div>
                            </div>
                            <div class="dropdown-divider"></div>
                            <form method="POST" action="{{route('logout')}}">
                                @csrf
                                <button class="dropdown-item text-danger" type="submit" onclick="return confirm('Etes vous sure de vouloir vous deconnecter?')">
                                    <i class="fas fa-sign-out-alt mr-2"></i> Déconnexion
                                </button>
                            </form>
                        </div>
                    </li>
                    </li>
                </ul>
            </div>
        </nav>
        <!-- /.navbar -->
