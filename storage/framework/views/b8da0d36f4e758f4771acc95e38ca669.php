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
    <main class="mx-auto max-w-7xl space-y-6 p-6">
        <h1 class="text-2xl font-semibold">Dashboard Mentor</h1>
        <section>
            <h2 class="text-lg font-medium">Peserta bimbingan (<?php echo e($applications->count()); ?>)</h2>
            <ul class="divide-y">
                <?php $__currentLoopData = $applications; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $application): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <li class="py-3"><?php echo e($application->user?->name); ?> — <?php echo e($application->tracking_code); ?></li>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </ul>
        </section>
        <section>
            <h2 class="text-lg font-medium">Presensi menunggu verifikasi (<?php echo e($pendingAttendances->count()); ?>)</h2>
        </section>
        <section>
            <h2 class="text-lg font-medium">Logbook menunggu persetujuan (<?php echo e($pendingLogbooks->count()); ?>)</h2>
        </section>
    </main>
</div>
<?php /**PATH C:\Users\HP\Downloads\simagang-backend-main\simagang-backend-main\resources\views\dashboard\mentor.blade.php ENDPATH**/ ?>