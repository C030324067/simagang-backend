<div class="min-h-screen bg-gray-50">
    <?php if (isset($component)) { $__componentOriginal40952f11f88edffbac24f3f0b079e381 = $component; } ?>
<?php if (isset($attributes)) { $__attributesOriginal40952f11f88edffbac24f3f0b079e381 = $attributes; } ?>
<?php $component = Illuminate\View\AnonymousComponent::resolve(['view' => 'components.navbar-role-switcher','data' => []] + (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag ? $attributes->all() : [])); ?>
<?php $component->withName('navbar-role-switcher'); ?>
<?php if ($component->shouldRender()): ?>
<?php $__env->startComponent($component->resolveView(), $component->data()); ?>
<?php if (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag): ?>
<?php $attributes = $attributes->except(\Illuminate\View\AnonymousComponent::ignoredParameterNames()); ?>
<?php endif; ?>
<?php $component->withAttributes([]); ?>
<?php echo $__env->renderComponent(); ?>
<?php endif; ?>
<?php if (isset($__attributesOriginal40952f11f88edffbac24f3f0b079e381)): ?>
<?php $attributes = $__attributesOriginal40952f11f88edffbac24f3f0b079e381; ?>
<?php unset($__attributesOriginal40952f11f88edffbac24f3f0b079e381); ?>
<?php endif; ?>
<?php if (isset($__componentOriginal40952f11f88edffbac24f3f0b079e381)): ?>
<?php $component = $__componentOriginal40952f11f88edffbac24f3f0b079e381; ?>
<?php unset($__componentOriginal40952f11f88edffbac24f3f0b079e381); ?>
<?php endif; ?>
    <main class="mx-auto max-w-7xl p-6">
        <h1 class="text-2xl font-semibold">Dashboard Kepala Bidang</h1>
        <p class="mt-2">Total permohonan: <?php echo e($totalApplications); ?></p>
        <p>Menunggu verifikasi: <?php echo e($pendingApplications); ?></p>
        <ul class="mt-4 divide-y">
            <?php $__currentLoopData = $applications; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $application): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <li class="py-3"><?php echo e($application->tracking_code); ?> — <?php echo e($application->final_status); ?></li>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </ul>
    </main>
</div>
<?php /**PATH C:\Users\HP\Downloads\simagang-backend-main\simagang-backend-main\resources\views\dashboard\kabid.blade.php ENDPATH**/ ?>