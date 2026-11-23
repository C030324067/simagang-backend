<?php
    $activeRole = auth()->user()?->activeRole();
    $roleLabels = ['kabid' => 'Kepala Bidang', 'mentor' => 'Mentor'];
?>

<?php if($activeRole): ?>
    <div class="relative inline-flex items-center gap-3">
        <span class="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
            Aktif: <?php echo e($roleLabels[$activeRole] ?? $activeRole); ?>

        </span>

        <details class="group relative">
            <summary class="cursor-pointer list-none rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Ganti konteks <span aria-hidden="true">⌄</span>
            </summary>
            <div class="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                <?php $__currentLoopData = ['kabid' => 'Kepala Bidang', 'mentor' => 'Mentor']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $role => $label): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php if(auth()->user()->hasRole($role) && $role !== $activeRole): ?>
                        <form method="POST" action="<?php echo e(route('role.switch')); ?>">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="role" value="<?php echo e($role); ?>">
                            <button type="submit" class="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                                <?php echo e($label); ?>

                            </button>
                        </form>
                    <?php endif; ?>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
        </details>
    </div>
<?php endif; ?>
<?php /**PATH C:\Users\HP\Downloads\simagang-backend-main\simagang-backend-main\resources\views\components\navbar-role-switcher.blade.php ENDPATH**/ ?>